<p align="center">
  <a href="https://github.com/VestalisDE/AmongOBS">
    <img src="logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">AmongOBS</h3>
  <p align="center">
    Scene switcher for streamers, supporting <a href="https://obsproject.com/">OBS Studio</a> and <a href="https://streamlabs.com/streamlabs-obs">Streamlabs OBS</a>
    <br />
    <a href="https://github.com/VestalisDE/AmongOBS/issues">Report Bug / Request Feature</a> · <a href="#installation"><b>INSTALLATION INSTRUCTIONS</b></a>
  </p>
  <p align="center">
    If you like this project and want to support me, you can <b><a href="https://paypal.me/markusgubitz">DONATE TO THE PROJECT</a></b>
  </p>
</p>

## Demo
[![Tech Demo](https://img.youtube.com/vi/39XW-fReY68/0.jpg)](https://youtu.be/39XW-fReY68 "AmongOBS Tech Demo")

<!-- ABOUT THE PROJECT -->
## About The Project

This projects connects Among Us with <a href="https://obsproject.com/">OBS Studio</a> and <a href="https://streamlabs.com/streamlabs-obs">Streamlabs OBS</a>.
You will be able to switch between scenes, based on game events such as beeing in menu, lobby or discussion or doing tasks.

Currently running in beta state, quick draw as a proof of concept.
There is currently no UI but UI is not necessarily needed so this Beta version 

## Installation
Simply run the installer of AmongOBS and install the required plugin for OBS Studio.

### OBS Studio
You need to install <a href="https://github.com/Palakis/obs-websocket/">OBS Websocket</a> in order to enable Websocket connections in OBS Studio.

### Streamlabs OBS
Streamlabs OBS does not require any further plugins, as it supports websocket connections out of the box.

## Setting up AmongOBS
AmongOBS connects to OBS by default (`localhost:4444` without token). You can actually configure own an own connection (server, port, token) in the config.
Also you can adjust the scenes to be switched in in the config, which *has to be done after the first launch*.

## License

Distributed under the GNU General Public License v3.0. See `LICENSE` for more information.
Please also have a look at <a href="https://github.com/ottomated/CrewLink">CrewLink by ottomated</a>, a free, open Among Us proximity voice chat, which made this project possible.
