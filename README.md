# node-red-contrib-broadlink
[![GitHub version](https://badge.fury.io/gh/mlfunston%2Fnode-red-contrib-broadlink.svg)](https://badge.fury.io/gh/mlfunston%2Fnode-red-contrib-broadlink) 
[![GitHub issues](https://img.shields.io/github/issues/mlfunston/node-red-contrib-broadlink.svg)](https://github.com/mlfunston/node-red-contrib-broadlink/issues) 
[![GitHub license](https://img.shields.io/github/license/mlfunston/node-red-contrib-broadlink.svg)](https://github.com/mlfunston/node-red-contrib-broadlink/blob/master/LICENSE) 
[![Twitter](https://img.shields.io/twitter/url/https/github.com/mlfunston/node-red-contrib-broadlink.svg?style=social)](https://twitter.com/intent/tweet?text=Wow:&url=https%3A%2F%2Fgithub.com%2Fmlfunston%2Fnode-red-contrib-broadlink)

A set of node-red nodes to manage the Broadlink http://www.ibroadlink.com/ RM series of IR Controllers and  for home automation. A cost effective way to control Air Conditioners, TV's, Audio equipment and many more like a universal remote control unit.

## Supported Devices: RM-Mini 3, RM-Pro, etc
RM-Mini 3 - http://www.ibroadlink.com/rmMini3/
RM-Pro - http://www.ibroadlink.com/rmPro+/

## Installing and Setting up
Add the Broadlink node to node-red through the manage palette tab or command line.

You can either learn commands directly from the RM unit using the node, or from the Broadlink e-control app and export them. You will need the SharedData folder exported from the app as a starting point either way.

First, configure the Broadlink device through the Broadlink e-control app on your smartphone. You will need to copy some files from your device after setup.

For Apple devices use this app: https://itunes.apple.com/us/app/broadlink-e-control/id793152994?mt=8

## Configuring the Broadlink App
The app itself is not that intuitive, but after you add the RM device you will need to add a user defined device (eg an air conditioner or tv) and buttons. If you use one of the built in devices the remote commands aren't recorded in the files, so make sure to use `user defined`.
1.  Swipe left on the home screen to reveal your devices.
2.  Select the device
3.  Select the :gear: icon and add remote
4.  Click the `+` sign and add the buttons or functions you want to be able to use in node-red
5.  The app will ask you to point the remote at it and press the appropriate button
6.  Complete the process to add the buttons you need
7.  Click the :gear: icon and create shortcut if you want the device to be visible on the app home screen
8.  Return to the home screen and swipe right and click share and `Share to other phones in WLAN`

Now you are ready to copy the config files from the device to use in the node!

## Copying the files from an iPhone
1.  Use an app like iExplorer https://macroplant.com/iexplorer and connect your iPhone to your computer and do a backup using the tool
2.  Explore the backup and open the Apps section of the backup
3.  Find the `cn.com.broadlink.e-Control` folder and export it to your computer
4.  Put the folder into a location where node-red can see it. You will need the path to the `cn.com.broadlink.e-Control.new/Documents/SharedData/` folder later

## Copying files from and Android phone
I don't have one, but it should be simpler to find the folder on it and extract it. 
Perhaps someone can contribute here?

## Configuring node-red nodes
Assuming you have added the Broadlink nodes and configured as above, you will need the MAC address of the device, IP address and the path to the SharedData folder above.
1.  Add the RM node and double click it
2.  Select device and `add new rmdevice`
3.  Fill in the MAC address of the device, IP address and the full path to the SharedData folder in the `Catalog` field and click `Add`
4.  You will then need to save the node and click `Deploy` so that you can see the buttons you created in the Broadlink app in the node.
5.  Double click on the node again and you should be now able to select Action -> Send and then pick the remote and button you wish to send.
6.  Save node, add an inject node on the front and link them together and deploy.

Now you should be able to click on the inject node and fire a signal to your device!

Start adding extra nodes to fire out the functions you need or inject messages to the node to drive it.




