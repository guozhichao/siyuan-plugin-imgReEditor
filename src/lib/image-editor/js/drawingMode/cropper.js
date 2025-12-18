import DrawingMode from '@editor/interface/drawingMode';
import { drawingModes, componentNames as components } from '@editor/consts';

/**
 * CropperDrawingMode class
 * @class
 * @ignore
 */
class CropperDrawingMode extends DrawingMode {
  constructor() {
    super(drawingModes.CROPPER);
  }

  /**
   * start this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @override
   */
  start(graphics) {
    const cropper = graphics.getComponent(components.CROPPER);
    cropper.start();
  }

  /**
   * stop this drawing mode
   * @param {Graphics} graphics - Graphics instance
   * @override
   */
  end(graphics) {
    const cropper = graphics.getComponent(components.CROPPER);
    cropper.end();
  }
}

export default CropperDrawingMode;
