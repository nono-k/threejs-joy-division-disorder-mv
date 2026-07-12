import * as THREE from 'three';
import { Controls, OrthographicCamera } from './core/Camera';
import { Three } from './core/Three';
import { Media } from './Media';
import fragment from './shaders/fragment.glsl?raw';
import vertex from './shaders/vertex.glsl?raw';

export class App extends Three {
  private readonly camera: OrthographicCamera;
  private mesh!: THREE.Mesh;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    this.camera = new OrthographicCamera({ left: -1, right: 1, top: 1, bottom: -1, near: 0.1, far: 10 });
    this.camera.position.z = 1;

    new Controls(this.renderer, this.camera);
    this.init();
  }

  private async init() {
    this.scene.background = new THREE.Color('#222222');

    const media = new Media();
    await media.init();

    this.createGeometry(media);

    window.addEventListener('resize', this.resize.bind(this));
    this.renderer.setAnimationLoop(this.animate.bind(this));
  }

  private createGeometry(media: Media) {
    const geometry = new THREE.PlaneGeometry(2, 2);

    const video = document.getElementById('video') as HTMLVideoElement;
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      uniforms: {
        uMaskTexture: { value: media.maskTexture },
        uVideoTexture: { value: videoTexture },
        uTime: { value: 0 },
      },
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);
  }

  private animate() {
    const delta = this.clock.getDelta();

    const material = this.mesh.material as THREE.ShaderMaterial;

    if (material.uniforms.uTime) {
      material.uniforms.uTime.value += delta;
    }

    this.renderer.render(this.scene, this.camera);
  }

  private resize() {
    this.camera.update();
  }
}

const app = new App(document.getElementById('webgl') as HTMLCanvasElement);

window.addEventListener('beforeunload', () => {
  app.dispose();
});
