import '@editor/polyfill';
import ImageEditor from '@editor/imageEditor';
import '@editor-css/index.styl';

// commands
import '@editor/command/addIcon';
import '@editor/command/addImageObject';
import '@editor/command/addObject';
import '@editor/command/addShape';
import '@editor/command/addText';
import '@editor/command/applyFilter';
import '@editor/command/changeIconColor';
import '@editor/command/changeShape';
import '@editor/command/changeText';
import '@editor/command/changeTextStyle';
import '@editor/command/clearObjects';
import '@editor/command/flip';
import '@editor/command/loadImage';
import '@editor/command/removeFilter';
import '@editor/command/removeObject';
import '@editor/command/resizeCanvasDimension';
import '@editor/command/rotate';
import '@editor/command/setObjectProperties';
import '@editor/command/setObjectPosition';
import '@editor/command/changeSelection';
import '@editor/command/resize';

export default ImageEditor;
export { ImageEditor };
