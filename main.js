
// required electron modules
const electron = require('electron');
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const IPC = require('electron').ipcMain;
const { dialog, Menu } = require('electron');

const path = require('path');
const url = require('url');
const fs = require('fs');

// file template generator function
const fileContent = require('./fileContent.js');
const flattenComponent = require('./flattenComponent.js');
const openFile = require('./openFile.js');
const saveFile = require('./saveFile.js');

require('electron-reload')(__dirname);
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    titleBarStyle: 'hidden',
    width: 720,
    height: 420,
    minWidth: 645,
    minHeight: 360,
    icon: path.join(__dirname, './assets/icons/png/128x128.png')
  })
/*
  //menu items
  const menuTemplate = [
    {
      label:'File',
      submenu: [{
        label:'Open',
        click:()=>{
          openFile();
        }
      },
      // {
      //   label:'Save as',
      //   click:()=>{
      //     saveFile();
      //   }
      // },
      // {
      //   label:'Save',
      //   click:()=>{
      //     saveFile();
      //   }
      // },
      {
        label:'Quit',
        click:()=>{
          app.quit();
        }
      }]
    }
  ];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
*/

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  mainWindow.webContents.openDevTools()



  /* - the IPC listens for component info to be received from the front end.
     - openDialog lets user to select where exported file folder will be generated.
     - openDialog outputs the file directory (fileDir) that was chosen by the user.
     - a directory gets created.
     - for each component filecontent is called and file is generated with its content.
  */
  IPC.on('componentTree', (event, components) => {
    let flattenComps = flattenComponent(components);
    dialog.showOpenDialog({
      title: 'please select where to export',
      properties: ['openDirectory'],
      buttonLabel: 'Save'
    }, fileDir => {
      let projDir = fileDir + '/components';
      fs.mkdir(projDir, err => {
        if (err) {
          dialog.showErrorBox('Duplicate Folder Error', 'A component folder already exists in selected directory')
        }
        else {
          for (let k = 0; k < flattenComps.length; k++) {
            fs.writeFileSync(projDir + '/' + flattenComps[k].title + '.jsx', fileContent(flattenComps[k]));
          };

          dialog.showMessageBox({ message: 'Component folder has been exported.', buttons: ['OK'] })
          event.sender.send('fileSuccess', 412)
        }
      });
    })
  })

IPC.on('openFile',(event) =>{
  dialog.showOpenDialog({
      title:'Please select your .rp file',
      properties:['openFile'],
      filters:[{name:'All Files', extensions: ['rp']}]
    },
      filename => {
        fs.readFileSync(filename, data => {
          event.sender.send('fileData', data);
        })
      }
    )
})

IPC.on('saveFile',(event,state) =>{
  dialog.showSaveDialog( filename => {
      fs.writeFileSync(filename,state);
      })
  });


  // As we are in windows, escape the slash with another
  // const configValues = require('./config');
  // BrowserWindow.addDevToolsExtension(configValues.absolutePath);

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})
