/**
 * Image Editor Dialog
 * Wraps tui-image-editor for editing images in SiYuan
 */

import { Dialog, showMessage } from 'siyuan';
import ImageEditor from 'tui-image-editor';
import 'tui-image-editor/dist/tui-image-editor.css';
import { readMetadata, writeMetadata, isPNG } from '../utils/png-metadata';
import { fetchSyncPost } from '../api';

export interface ImageInfo {
    url: string;
    name: string;
}

export class ImageEditorDialog {
    private dialog: Dialog;
    private editor: ImageEditor | null = null;
    private imageInfo: ImageInfo;
    private blockID: string;
    private plugin: any;

    constructor(plugin: any, imageInfo: ImageInfo, blockID: string) {
        this.plugin = plugin;
        this.imageInfo = imageInfo;
        this.blockID = blockID;
    }

    async open() {
        // Create dialog
        this.dialog = new Dialog({
            title: '图片编辑器',
            content: `
                <div class="image-editor-container" style="height: 100%;">
                    <div id="tui-image-editor" style="height: calc(100% - 60px);"></div>
                    <div class="image-editor-toolbar" style="padding: 10px; text-align: right; border-top: 1px solid var(--b3-border-color);">
                        <button class="b3-button b3-button--cancel" id="editor-cancel">取消</button>
                        <button class="b3-button b3-button--text" id="editor-save">保存</button>
                    </div>
                </div>
            `,
            width: '90vw',
            height: '90vh',
            destroyCallback: () => {
                if (this.editor) {
                    this.editor.destroy();
                    this.editor = null;
                }
            }
        });

        // Initialize editor after dialog is rendered
        setTimeout(() => this.initEditor(), 100);

        // Setup button handlers
        const saveBtn = this.dialog.element.querySelector('#editor-save') as HTMLButtonElement;
        const cancelBtn = this.dialog.element.querySelector('#editor-cancel') as HTMLButtonElement;

        saveBtn?.addEventListener('click', () => this.save());
        cancelBtn?.addEventListener('click', () => this.dialog.destroy());
    }

    private async initEditor() {
        const container = this.dialog.element.querySelector('#tui-image-editor');
        if (!container) {
            console.error('Editor container not found');
            return;
        }

        // Initialize tui-image-editor
        this.editor = new ImageEditor(container as HTMLElement, {
            includeUI: {
                loadImage: {
                    path: '',
                    name: this.imageInfo.name
                },
                theme: {
                    'common.bi.image': '',
                    'common.bisize.width': '0',
                    'common.bisize.height': '0',
                    'common.backgroundImage': 'none',
                    'common.backgroundColor': 'var(--b3-theme-background)',
                    'common.border': '0px'
                },
                menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'mask', 'filter'],
                initMenu: 'draw',
                uiSize: {
                    width: '100%',
                    height: '100%'
                },
                menuBarPosition: 'bottom'
            },
            cssMaxWidth: 9999,
            cssMaxHeight: 9999,
            usageStatistics: false
        });

        // Load image
        await this.loadImage();
    }

    private async loadImage() {
        if (!this.editor) return;

        try {
            // Fetch image
            const imageUrl = this.imageInfo.url.startsWith('assets/')
                ? `/assets/${this.imageInfo.url.substring(7)}`
                : this.imageInfo.url;

            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Check if PNG and has edit data
            let editData: string | null = null;
            if (isPNG(uint8Array)) {
                editData = readMetadata(uint8Array);
            }

            // Load image into editor
            const imageObjectUrl = URL.createObjectURL(blob);
            await this.editor.loadImageFromURL(imageObjectUrl, this.imageInfo.name);

            // Restore edit state if exists
            if (editData) {
                try {
                    const state = JSON.parse(editData);
                    if (state && state.objects) {
                        // Load objects (shapes, text, etc.)
                        for (const obj of state.objects) {
                            // Note: tui-image-editor doesn't have a direct API to restore full state
                            // We would need to recreate each object based on its type
                            // This is a simplified version - full implementation would handle all object types
                            console.log('Restoring object:', obj);
                        }
                    }
                } catch (e) {
                    console.error('Failed to restore edit data:', e);
                }
            }

        } catch (error) {
            console.error('Failed to load image:', error);
            showMessage('加载图片失败', 3000, 'error');
        }
    }

    private async save() {
        if (!this.editor) return;

        try {
            // Get edited image as blob
            const dataURL = this.editor.toDataURL();
            const response = await fetch(dataURL);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            let uint8Array = new Uint8Array(arrayBuffer);

            // Get editor state for re-editing
            const editorState = {
                objects: (this.editor as any)._graphics?._objects || [],
                timestamp: Date.now()
            };
            const editData = JSON.stringify(editorState);

            // Embed edit data into PNG if it's a PNG file
            if (isPNG(uint8Array)) {
                uint8Array = writeMetadata(uint8Array, 'ImageEditorData', editData);
            }

            // Create new blob with metadata
            const finalBlob = new Blob([uint8Array], { type: 'image/png' });

            // Generate filename
            const timestamp = new Date().getTime();
            const imageName = `${timestamp}.png`;

            // Upload to SiYuan
            const file = new File([finalBlob], imageName, { type: finalBlob.type });
            const formData = new FormData();
            formData.append('path', `data/assets/${imageName}`);
            formData.append('file', file);
            formData.append('isDir', 'false');

            await fetchSyncPost('/api/file/putFile', formData);

            // Update block with new image
            const imageURL = `assets/${imageName}`;
            await fetchSyncPost('/api/attr/setBlockAttrs', {
                id: this.blockID,
                attrs: {
                    'custom-image-edited': 'true',
                    'custom-image-url': imageURL
                }
            });

            // Update image src in the document
            await fetchSyncPost('/api/block/updateBlock', {
                id: this.blockID,
                dataType: 'markdown',
                data: `![${imageName}](${imageURL})`
            });

            showMessage('图片保存成功', 3000, 'info');
            this.dialog.destroy();

        } catch (error) {
            console.error('Failed to save image:', error);
            showMessage('保存图片失败', 3000, 'error');
        }
    }
}
