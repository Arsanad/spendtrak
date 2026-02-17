/**
 * AnimatedBackground.tsx
 *
 * WebView-based Three.js background — runs the ACTUAL website code via WebGL.
 * This guarantees pixel-identical rendering to spendtrak.app.
 *
 * Priority order:
 *   1. WebView (react-native-webview) — identical to website
 *   2. GLView (expo-gl + expo-three) — native OpenGL ES fallback
 *   3. 2D Animated fallback — when neither is available
 *
 * WebView renders shapes only. Stars are a separate React Native Reanimated layer.
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Check WebView availability
let WebViewAvailable = false;
try {
  require('react-native-webview');
  WebViewAvailable = true;
} catch (e) {}

// Check expo-gl availability
let GLView: any = null;
let ExpoRenderer: any = null;
let THREE: any = null;

try {
  GLView = require('expo-gl').GLView;
  ExpoRenderer = require('expo-three').Renderer;
  THREE = require('three');
} catch (e) {}

interface Props {
  children?: React.ReactNode;
}

// =====================================================================
// STAR FIELD — Tiny twinkling pinpoints via Reanimated
// =====================================================================
interface StarData {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  minOpacity: number;
  maxOpacity: number;
}

const Star: React.FC<StarData> = React.memo(({ x, y, size, delay, duration, minOpacity, maxOpacity }) => {
  const opacity = useSharedValue(minOpacity);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(maxOpacity, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(minOpacity, { duration, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: '#00ff88',
        },
        animatedStyle,
      ]}
    />
  );
});

const StarField: React.FC = React.memo(() => {
  const stars = useMemo<StarData[]>(() => {
    const result: StarData[] = [];
    for (let i = 0; i < 150; i++) {
      result.push({
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * SCREEN_HEIGHT,
        size: 1 + Math.random() * 1.5, // 1–2.5px — tiny pinpoints
        delay: Math.random() * 4000,
        duration: 1500 + Math.random() * 3000,
        minOpacity: 0.1 + Math.random() * 0.2,
        maxOpacity: 0.5 + Math.random() * 0.4,
      });
    }
    return result;
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {stars.map((star, i) => (
        <Star key={i} {...star} />
      ))}
    </View>
  );
});

// =====================================================================
// 3D BACKGROUND (WebView) — Runs actual website Three.js via WebGL
// =====================================================================
const ThreeBackground: React.FC<Props> = ({ children }) => {
  const WebViewComponent = require('react-native-webview').WebView;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0}
body{background:#000;overflow:hidden;touch-action:none}
canvas{position:fixed;top:0;left:0;width:100%;height:100%}
</style>
</head>
<body>
<canvas id="scene"></canvas>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
<script>
try{
var canvas=document.getElementById('scene');
var scene=new THREE.Scene();
var camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
var renderer=new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:true});
scene.fog=new THREE.FogExp2(0x000000,0.02);
camera.position.z=50;
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));

var light1=new THREE.PointLight(0x00ff88,2,100);
light1.position.set(30,30,30);
scene.add(light1);
var light2=new THREE.PointLight(0x39FF14,1.5,100);
light2.position.set(-30,-30,30);
scene.add(light2);
var ambientLight=new THREE.AmbientLight(0xffffff,0.3);
scene.add(ambientLight);

var objects=[];
var geometries=[
function(){return new THREE.TorusKnotGeometry(1.5,0.5,64,8);},
function(){return new THREE.TorusKnotGeometry(1.5,0.35,120,8,6,5);},
function(){return new THREE.TorusKnotGeometry(1.2,0.5,150,8,1,4);},
function(){return new THREE.TorusKnotGeometry(1.5,0.3,128,8,3,7);},
function(){return new THREE.TorusKnotGeometry(1.5,0.35,150,8,5,4);},
function(){return new THREE.TorusKnotGeometry(1.5,0.4,100,8,2,5);},
function(){return new THREE.TorusGeometry(1,1,16,32);}
];

for(var i=0;i<25;i++){
var geoFn=geometries[Math.floor(Math.random()*geometries.length)];
var geo=geoFn();
var group=new THREE.Group();
var solidMat=new THREE.MeshPhongMaterial({
color:new THREE.Color().setHSL(0.4+Math.random()*0.1,0.8,0.5),
emissive:0x00ff88,
emissiveIntensity:0.2,
transparent:true,
opacity:0.5,
wireframe:false
});
group.add(new THREE.Mesh(geo,solidMat));
var wireMat=new THREE.MeshPhongMaterial({
color:new THREE.Color().setHSL(0.42,0.8,0.55),
emissive:0x00ff88,
emissiveIntensity:0.3,
transparent:true,
opacity:0.7,
wireframe:true
});
group.add(new THREE.Mesh(geo.clone(),wireMat));
group.position.set((Math.random()-0.5)*100,(Math.random()-0.5)*100,(Math.random()-0.5)*100);
group.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI);
group.userData={
rotSpeed:{x:(Math.random()-0.5)*0.02,y:(Math.random()-0.5)*0.02,z:(Math.random()-0.5)*0.02},
floatSpeed:Math.random()*0.003+0.001,
floatOffset:Math.random()*Math.PI*2
};
scene.add(group);
objects.push(group);
}

var driftAngle=0;
function animate(){
requestAnimationFrame(animate);
var time=performance.now()*0.001;
driftAngle+=0.002;
camera.position.x+=(Math.sin(driftAngle)*3-camera.position.x)*0.05;
camera.position.y+=(Math.cos(driftAngle*0.7)*2-camera.position.y)*0.05;
camera.position.z=50;
camera.lookAt(0,0,0);
for(var k=0;k<objects.length;k++){
var obj=objects[k];
obj.rotation.x+=obj.userData.rotSpeed.x;
obj.rotation.y+=obj.userData.rotSpeed.y;
obj.rotation.z+=obj.userData.rotSpeed.z;
obj.position.y+=Math.sin(time*obj.userData.floatSpeed+obj.userData.floatOffset)*0.02;
var s=1+Math.sin(time*2+k)*0.1;
obj.scale.set(s,s,s);
}
renderer.render(scene,camera);
}
animate();
window.addEventListener('resize',function(){
camera.aspect=window.innerWidth/window.innerHeight;
camera.updateProjectionMatrix();
renderer.setSize(window.innerWidth,window.innerHeight);
});
}catch(e){console.warn('3D error:',e)}
<\/script>
</body>
</html>`;

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <WebViewComponent
          source={{ html }}
          style={{ flex: 1, backgroundColor: '#000000' }}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          javaScriptEnabled={true}
          domStorageEnabled={false}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          androidLayerType="hardware"
          originWhitelist={['*']}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <StarField />
      <View style={[StyleSheet.absoluteFillObject, { zIndex: 1 }]} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

// =====================================================================
// 3D BACKGROUND (GLView) — Native OpenGL ES fallback
// =====================================================================
const GLThreeBackground: React.FC<Props> = ({ children }) => {
  const animationFrameRef = useRef<number | null>(null);

  const onContextCreate = useCallback(async (gl: any) => {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.02);

    const camera = new THREE.PerspectiveCamera(
      75,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    const renderer = new ExpoRenderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderer.setPixelRatio(Math.min(2, gl.drawingBufferWidth / SCREEN_WIDTH));
    renderer.setClearColor(0x000000, 1);

    const light1 = new THREE.PointLight(0x00ff88, 2, 100);
    light1.position.set(30, 30, 30);
    scene.add(light1);

    const light2 = new THREE.PointLight(0x39FF14, 1.5, 100);
    light2.position.set(-30, -30, 30);
    scene.add(light2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const objects: any[] = [];
    const geometries = [
      new THREE.TorusKnotGeometry(3, 1, 64, 8),
      new THREE.IcosahedronGeometry(4, 0),
      new THREE.OctahedronGeometry(5, 0),
      new THREE.TetrahedronGeometry(4, 0),
    ];

    for (let i = 0; i < 25; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setHSL(0.4 + Math.random() * 0.1, 0.8, 0.5),
        emissive: 0x00ff88,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.6,
        wireframe: Math.random() > 0.5,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
      );
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      mesh.userData = {
        rotSpeed: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02,
        },
        floatSpeed: Math.random() * 0.003 + 0.001,
        floatOffset: Math.random() * Math.PI * 2,
      };

      scene.add(mesh);
      objects.push(mesh);
    }

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const time = performance.now() * 0.001;

      camera.position.z = 50;
      camera.lookAt(0, 0, 0);

      objects.forEach((obj: any, k: number) => {
        obj.rotation.x += obj.userData.rotSpeed.x;
        obj.rotation.y += obj.userData.rotSpeed.y;
        obj.rotation.z += obj.userData.rotSpeed.z;
        obj.position.y += Math.sin(time * obj.userData.floatSpeed + obj.userData.floatOffset) * 0.02;
        const s = 1 + Math.sin(time * 2 + k) * 0.1;
        obj.scale.set(s, s, s);
      });

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <GLView
          style={{ flex: 1 }}
          onContextCreate={onContextCreate}
          msaaSamples={4}
        />
      </View>
      <View style={styles.smokeContainer} pointerEvents="none">
        <LinearGradient
          colors={[
            'transparent',
            'rgba(0, 255, 136, 0.03)',
            'rgba(0, 255, 136, 0.08)',
            'rgba(0, 255, 136, 0.15)',
            'rgba(0, 255, 136, 0.25)',
          ]}
          locations={[0, 0.3, 0.5, 0.7, 1]}
          style={styles.smokeBase}
        />
        <LinearGradient
          colors={[
            'transparent',
            'rgba(0, 255, 136, 0.05)',
            'rgba(57, 255, 20, 0.12)',
            'rgba(0, 255, 136, 0.2)',
          ]}
          locations={[0, 0.4, 0.7, 1]}
          style={styles.smokeGlow}
        />
      </View>
      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

// =====================================================================
// 2D FALLBACK — Animated placeholder when neither WebView nor expo-gl available
// =====================================================================
const FallbackBackground: React.FC<Props> = ({ children }) => {
  const shapes = useRef(
    Array.from({ length: 16 }, () => {
      const initX = Math.random() * SCREEN_WIDTH;
      const initY = Math.random() * SCREEN_HEIGHT;
      return {
        x: initX,
        y: new Animated.Value(initY),
        initY,
        rotation: new Animated.Value(0),
        scale: new Animated.Value(0.5 + Math.random() * 0.5),
        opacity: new Animated.Value(0.15 + Math.random() * 0.25),
        size: 20 + Math.random() * 40,
        isWireframe: Math.random() > 0.5,
      };
    })
  ).current;

  const particles = useRef(
    Array.from({ length: 50 }, () => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      opacity: new Animated.Value(0.3 + Math.random() * 0.5),
      size: 1 + Math.random() * 2,
    }))
  ).current;

  useEffect(() => {
    shapes.forEach((shape, i) => {
      const floatY = () => {
        Animated.sequence([
          Animated.timing(shape.y, {
            toValue: shape.initY - 15 - Math.random() * 20,
            duration: 3000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
          Animated.timing(shape.y, {
            toValue: shape.initY + 15 + Math.random() * 20,
            duration: 3000 + Math.random() * 4000,
            useNativeDriver: true,
          }),
        ]).start(() => floatY());
      };
      floatY();

      const rotate = () => {
        Animated.timing(shape.rotation, {
          toValue: 360,
          duration: 8000 + Math.random() * 12000,
          useNativeDriver: true,
        }).start(() => {
          shape.rotation.setValue(0);
          rotate();
        });
      };
      rotate();

      const pulse = () => {
        Animated.sequence([
          Animated.timing(shape.scale, {
            toValue: 0.6 + Math.random() * 0.6,
            duration: 2000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
          Animated.timing(shape.scale, {
            toValue: 0.4 + Math.random() * 0.4,
            duration: 2000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
        ]).start(() => pulse());
      };
      pulse();
    });

    particles.forEach((p) => {
      const twinkle = () => {
        Animated.sequence([
          Animated.timing(p.opacity, {
            toValue: 0.1 + Math.random() * 0.4,
            duration: 1000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: 0.4 + Math.random() * 0.5,
            duration: 1000 + Math.random() * 3000,
            useNativeDriver: true,
          }),
        ]).start(() => twinkle());
      };
      twinkle();
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        {particles.map((p, i) => (
          <Animated.View
            key={`p-${i}`}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: '#00ff88',
              opacity: p.opacity,
            }}
          />
        ))}

        {shapes.map((shape, i) => {
          const rotateInterpolate = shape.rotation.interpolate({
            inputRange: [0, 360],
            outputRange: ['0deg', '360deg'],
          });

          return (
            <Animated.View
              key={`s-${i}`}
              style={{
                position: 'absolute',
                left: shape.x,
                top: shape.y,
                width: shape.size,
                height: shape.size,
                opacity: shape.opacity,
                transform: [
                  { rotate: rotateInterpolate },
                  { scale: shape.scale },
                ],
                borderWidth: shape.isWireframe ? 1.5 : 0,
                borderColor: i % 2 === 0 ? '#00ff88' : '#39FF14',
                backgroundColor: shape.isWireframe ? 'transparent' : (i % 2 === 0 ? 'rgba(0,255,136,0.15)' : 'rgba(57,255,20,0.12)'),
                borderRadius: i % 4 === 0 ? shape.size / 2 : i % 4 === 1 ? 4 : 0,
              }}
            />
          );
        })}
      </View>

      <View style={styles.smokeContainer} pointerEvents="none">
        <LinearGradient
          colors={[
            'transparent',
            'rgba(0, 255, 136, 0.03)',
            'rgba(0, 255, 136, 0.08)',
            'rgba(0, 255, 136, 0.15)',
            'rgba(0, 255, 136, 0.25)',
          ]}
          locations={[0, 0.3, 0.5, 0.7, 1]}
          style={styles.smokeBase}
        />
        <LinearGradient
          colors={[
            'transparent',
            'rgba(0, 255, 136, 0.05)',
            'rgba(57, 255, 20, 0.12)',
            'rgba(0, 255, 136, 0.2)',
          ]}
          locations={[0, 0.4, 0.7, 1]}
          style={styles.smokeGlow}
        />
      </View>

      <View style={styles.content} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

// =====================================================================
// EXPORT — WebView first, then GLView, then 2D fallback
// =====================================================================
const AnimatedBackground: React.FC<Props> = (props) => {
  if (WebViewAvailable) {
    return <ThreeBackground {...props} />;
  }
  if (GLView && ExpoRenderer && THREE) {
    return <GLThreeBackground {...props} />;
  }
  return <FallbackBackground {...props} />;
};

export default AnimatedBackground;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  smokeContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
    pointerEvents: 'none',
  },
  smokeBase: {
    ...StyleSheet.absoluteFillObject,
  },
  smokeGlow: {
    position: 'absolute',
    bottom: 0,
    left: '-10%' as any,
    right: '-10%' as any,
    height: '60%' as any,
    opacity: 0.8,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
  },
});
