import sys
order=['core','gfx','props','landmarks','world','character','audio','game','ui','main']
js='\n'.join(open(f'src/{n}.js').read() for n in order)
shell=open('src/shell.html').read()
cdn=['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js']+[f'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/{p}' for p in ['shaders/CopyShader.js','shaders/LuminosityHighPassShader.js','postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/ShaderPass.js','postprocessing/UnrealBloomPass.js']]
local=['node_modules/three/build/three.min.js']+[f'node_modules/three/examples/js/{p}' for p in ['shaders/CopyShader.js','shaders/LuminosityHighPassShader.js','postprocessing/EffectComposer.js','postprocessing/RenderPass.js','postprocessing/ShaderPass.js','postprocessing/UnrealBloomPass.js']]
def page(srcs):
    tags='\n'.join(f'<script src="{s}"></script>' for s in srcs)
    return shell+'\n'+tags+'\n<script>\n'+js+'\n</script>\n'
head='<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<meta name="theme-color" content="#0f0b24">\n<meta property="og:title" content="Hyderabad Run 3D">\n<meta property="og:description" content="Run the city. Conquer the distance. A 3D endless runner from Charminar to HITEC City.">\n</head>\n<body>\n'
open('index.html','w').write(head+page(cdn)+'</body>\n</html>\n')
print('index.html built')
