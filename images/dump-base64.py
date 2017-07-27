import base64
import os
import sys

#from PIL import Image

for filename in sys.argv[1:]:
    if filename.endswith('png'):
        status = os.system('curl -X POST -s --form "input=@%s;type=image/png" http://pngcrush.com/crush > crushed.png' % filename)
        if status:
            raise Exception('Failed to crush PNG')
        data = open('crushed.png', 'rb').read()
    else:
        data = open(filename, 'rb').read()

#    image = Image.open(filename)

#    print filename, image.size, ('data:image/png;base64,' + base64.b64encode(data))
    print (filename, ('data:image/png;base64,' + base64.b64encode(data).decode('utf-8')))

if os.path.isfile('crushed.png'):
    os.remove('crushed.png')
