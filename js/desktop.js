//Menubar for electron
'use strict';

const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

var template = [
{
	label: 'Edit',
	submenu: [
	  {
	    label: 'Cut',
	    accelerator: 'CmdOrCtrl+X',
	    role: 'cut'
	  },
	  {
	    label: 'Copy',
	    accelerator: 'CmdOrCtrl+C',
	    role: 'copy'
	  },
	  {
	    label: 'Paste',
	    accelerator: 'CmdOrCtrl+V',
	    role: 'paste'
	  },
	  {
	    label: 'Select All',
	    accelerator: 'CmdOrCtrl+A',
	    role: 'selectall'
	  },
	]
	}
]; //End template for menubar

if (process.platform == 'darwin') {
  var name = "Jaxx"
  template.unshift({
    label: name,
    submenu: [
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: closeDesktopApp
      },
    ]
  });
  }

var menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);



//------------------Context menu (right click)

const InputMenu = Menu.buildFromTemplate([{
        label: 'Undo',
        role: 'undo',
    }, {
        label: 'Redo',
        role: 'redo',
    }, {
        type: 'separator',
    }, {
        label: 'Cut',
        role: 'cut',
    }, {
        label: 'Copy',
        role: 'copy',
    }, {
        label: 'Paste',
        role: 'paste',
    }, {
        type: 'separator',
    }, {
        label: 'Select all',
        role: 'selectall',
    },
]);

document.body.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();

    let node = e.target;

    while (node) {
        if (node.nodeName.match(/^(input|textarea|span)$/i) || node.isContentEditable) {
            InputMenu.popup(remote.getCurrentWindow());
        }
        node = node.parentNode;
    }
});

//------------------------------ Other desktop-specific functionalities
function closeDesktopApp(){
	remote.app.quit();
}