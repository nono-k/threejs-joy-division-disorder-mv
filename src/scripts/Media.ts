import { FilesetResolver, ImageSegmenter, type MPMask } from '@mediapipe/tasks-vision';
import * as THREE from 'three';

export class Media {
  video: HTMLVideoElement;
  lastVideoTime: number;
  imageSegmenter?: ImageSegmenter;
  maskTexture: THREE.DataTexture | null = null;

  constructor() {
    this.video = document.getElementById('video') as HTMLVideoElement;
    this.video.play();

    this.lastVideoTime = -1;
  }

  async init() {
    const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm');

    this.imageSegmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      outputCategoryMask: false,
      outputConfidenceMasks: true,
    });

    this.predictLoop();
  }

  predictLoop = () => {
    if (this.video.currentTime !== this.lastVideoTime && this.imageSegmenter) {
      this.lastVideoTime = this.video.currentTime;

      const startTimeMs = performance.now();
      const result = this.imageSegmenter.segmentForVideo(this.video, startTimeMs);

      this.updateMaskTexture(result.confidenceMasks?.[0]);
    }
    requestAnimationFrame(this.predictLoop);
  };

  updateMaskTexture(mask?: MPMask): void {
    if (!mask) return;
    const { width, height } = mask;
    const data = mask.getAsFloat32Array();

    if (!this.maskTexture) {
      this.maskTexture = new THREE.DataTexture(data, width, height, THREE.RedFormat, THREE.FloatType);

      this.maskTexture.flipY = true;
      this.maskTexture.needsUpdate = true;
      return;
    }

    this.maskTexture.image.data?.set(data);
    this.maskTexture.needsUpdate = true;
  }
}
