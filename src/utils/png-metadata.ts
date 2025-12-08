/**
 * PNG Metadata utilities for reading/writing iTXt chunks
 * Used to store image editor state in PNG files for re-editing
 */

import extract from 'png-chunks-extract';
import encode from 'png-chunks-encode';
import text from 'png-chunk-text';

const EDIT_DATA_KEY = 'ImageEditorData';

/**
 * Read metadata from PNG iTXt/tEXt chunk
 * @param buffer PNG file as Uint8Array
 * @param key Metadata key to read
 * @returns Metadata value or null if not found
 */
export function readMetadata(buffer: Uint8Array, key: string = EDIT_DATA_KEY): string | null {
    try {
        const chunks = extract(buffer);

        for (const chunk of chunks) {
            if (chunk.name === 'tEXt' || chunk.name === 'iTXt') {
                try {
                    const textData = text.decode(chunk.data);
                    if (textData.keyword === key) {
                        return textData.text;
                    }
                } catch (e) {
                    // Skip invalid text chunks
                    continue;
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Error reading PNG metadata:', error);
        return null;
    }
}

/**
 * Write metadata to PNG iTXt chunk
 * @param buffer PNG file as Uint8Array
 * @param key Metadata key
 * @param value Metadata value
 * @returns Modified PNG as Uint8Array
 */
export function writeMetadata(buffer: Uint8Array, key: string = EDIT_DATA_KEY, value: string): Uint8Array {
    try {
        const chunks = extract(buffer);

        // Remove existing metadata with the same key
        const filteredChunks = chunks.filter(chunk => {
            if (chunk.name === 'tEXt' || chunk.name === 'iTXt') {
                try {
                    const textData = text.decode(chunk.data);
                    return textData.keyword !== key;
                } catch (e) {
                    return true;
                }
            }
            return true;
        });

        // Create new text chunk
        const textChunk = text.encode(key, value);

        // Insert before IEND chunk (last chunk)
        const iendIndex = filteredChunks.findIndex(chunk => chunk.name === 'IEND');
        if (iendIndex !== -1) {
            filteredChunks.splice(iendIndex, 0, {
                name: 'tEXt',
                data: textChunk
            });
        } else {
            // If no IEND found, append at the end
            filteredChunks.push({
                name: 'tEXt',
                data: textChunk
            });
        }

        return new Uint8Array(encode(filteredChunks));
    } catch (error) {
        console.error('Error writing PNG metadata:', error);
        throw error;
    }
}

/**
 * Check if a buffer is a valid PNG file
 */
export function isPNG(buffer: Uint8Array): boolean {
    // PNG signature: 137 80 78 71 13 10 26 10
    return buffer.length >= 8 &&
        buffer[0] === 137 &&
        buffer[1] === 80 &&
        buffer[2] === 78 &&
        buffer[3] === 71 &&
        buffer[4] === 13 &&
        buffer[5] === 10 &&
        buffer[6] === 26 &&
        buffer[7] === 10;
}
