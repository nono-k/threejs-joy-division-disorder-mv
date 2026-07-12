precision mediump float;

varying vec2 vUv;
uniform sampler2D uMaskTexture;
uniform sampler2D uVideoTexture;
uniform float uTime;

const float PI = 3.1415926;

void main() {
  vec2 uv = vUv;

  // ビデオのモノクロ化
  vec3 rawVideoColor = texture(uVideoTexture, uv).rgb;
  float monoVideo = dot(rawVideoColor, vec3(0.299, 0.587, 0.114));
  vec3 videoColor = vec3(monoVideo);

  vec3 darkColor = vec3(0.05);

  // 時間経過による背景色の変化
  float mixFactor = sin(uTime * 0.5) * 0.5 + 0.5;
  vec3 baseBg = mix(darkColor, videoColor, mixFactor);

  vec3 finalColor = baseBg;

  // 中央ほど線が強くなるように重み付け
  float centerWeight = sin(uv.x * PI);

  // 線の数と太さ
  float numLines = 30.0;
  float thickness = 0.002;

  // フラグ
  bool isOccluded = false;
  bool isOnLine = false;

  for (float i = 0.0; i < numLines; i++) {
    float vBase = i / numLines; // 線の基準位置（0.0〜1.0）

    // 人物マスクの取得
    float maskVal = texture(uMaskTexture, vec2(uv.x, vBase)).r;

    // マスクの値に応じて線の高さを変化させる
    float displacement = maskVal * 0.05 * centerWeight;

    float noise = sin(uv.x * 120.0 + vBase * 20.0 + uTime * 1.5) * 0.0025 * maskVal;

    float vLine = vBase + displacement + noise;

    // すでに線が描かれている場合は、下の線を描画しないようにする
    if (vBase < uv.y && vLine > uv.y) {
      isOccluded = true;
    }

    // 線の太さの範囲内にuv.yがある場合、線を描画する
    if (abs(uv.y - vLine) < thickness) {
      if (!isOccluded) {
        isOnLine = true;
      }
    }
  }

  // 線が遮蔽されている場合は背景色を使用
  if (isOccluded) {
    finalColor = baseBg;
  }

  // 線が描画されている場合は線の色を使用
  if (isOnLine) {
    vec3 lineColor = vec3(1.0);
    finalColor = lineColor;
  }

  // ビネット（周辺光量落ち）
  float vignetteRadius = 0.8;
  float vignetteEdge = 0.4;
  float vignetteDistance = length(uv - vec2(0.5, 0.5));
  float vignetteValue = smoothstep(vignetteRadius, vignetteRadius - vignetteEdge, vignetteDistance);
  finalColor *= vignetteValue;

  // フィルムトーン（彩度調整、暖かみ追加）
  // モノクロフィルムのようなセピア/琥珀色のトーン
  vec3 filmWarmth = vec3(1.0, 0.98, 0.94);
  finalColor *= filmWarmth;

  // フィルムハレーション（柔らかい発光）
  // 盛り上がったライン部分をわずかにぼかして発光させる（ブルーム）
  vec3 glowColor = vec3(0.98, 0.97, 0.95);
  if (isOnLine) {
    finalColor = mix(finalColor, glowColor, 0.2); // 非常にわずかに発光
  }

  gl_FragColor = vec4(finalColor, 1.0);
}