# Rebuilds index.html from src/.  Usage: python3 build.py
order = ['core', 'gfx', 'props', 'landmarks', 'world', 'character', 'realrunner', 'audio', 'game', 'ui', 'main']
js = '\n'.join(open(f'src/{n}.js').read() for n in order)
shell = open('src/shell.html').read()
libs = ['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'] + [f'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/{p}' for p in ['shaders/CopyShader.js', 'shaders/LuminosityHighPassShader.js', 'postprocessing/EffectComposer.js', 'postprocessing/RenderPass.js', 'postprocessing/ShaderPass.js', 'postprocessing/UnrealBloomPass.js', 'loaders/GLTFLoader.js']]
head = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n'
        '<meta name="theme-color" content="#0f0b24">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
        '<meta property="og:title" content="Hyderabad Run 3D">\n'
        '<meta property="og:description" content="Run the city. Conquer the distance. A 3D endless runner from Charminar to HITEC City.">\n'
        '</head>\n<body>\n')
tags = '\n'.join(f'<script src="{s}"></script>' for s in libs)
open('index.html', 'w').write(head + shell + '\n' + tags + '\n<script>\n' + js + '\n</script>\n</body>\n</html>\n')
print('index.html built')
