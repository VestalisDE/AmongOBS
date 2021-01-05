<p align="center">
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

<!-- ABOUT THE PROJECT -->
## About The Project

This projects connects Among Us with <a href="https://obsproject.com/">OBS Studio</a> and <a href="https://streamlabs.com/streamlabs-obs">Streamlabs OBS</a>.
You will be able to switch between scenes, based on game events such as beeing in menu, lobby or discussion or doing tasks.

Currently running in early alpha state, quick draw as a proof of concept.

## Installation
You need to install <a href="https://github.com/Palakis/obs-websocket/">OBS Websocket</a> in order to enable Websocket connections in OBS Studio 
Version 0.0.1a is hardcoded link to OBS Studio.

AmongOBS is hardcoded linked to `localhost:4444` and the scenes have to be named a special way according to the game states:
Game Lobby: `AmongUs_Lobby`
Game Tasks: `AmongUs_Tasks`
Game Discussion: `AmongUs_Discussion`
Game Menu: `AmongUs_Lobby`
Game Unknown: `AmongUs_Lobby`

OBS has to be running *before* launching AmongOBS, otherwise reload it with `CTRL+R`

## License

Distributed under the GNU General Public License v3.0. See `LICENSE` for more information.
Please also have a look at <a href="https://github.com/ottomated/CrewLink">CrewLink by ottomated</a>, a free, open Among Us proximity voice chat, which made this project possible.