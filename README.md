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

## DEMO
[![Tech Demo](https://img.youtube.com/vi/39XW-fReY68/0.jpg)](https://youtu.be/39XW-fReY68 "AmongOBS Tech Demo")
  (more demos coming soon, send me links to your VODs!)

------------------------------------------------------------
<!-- ABOUT THE PROJECT -->
## About The Project

This projects connects Among Us with <a href="https://obsproject.com/">OBS Studio</a> and <a href="https://streamlabs.com/streamlabs-obs">Streamlabs OBS</a>.
You will be able to switch between scenes, based on game events such as beeing in menu, lobby or discussion or doing tasks.

Currently running in beta state, quick draw as a proof of concept.
There is currently no UI but UI is not necessarily needed so this Beta version 

------------------------------------------------------------
<!-- INSTALLATION -->
## INSTALLATION
- Install AmongOBS with the given installer
- If you are using OBS Studio, install and setup <a href="https://github.com/Palakis/obs-websocket/">OBS Websocket</a>
- Launch AmongOBS
- Configure your OBS websocket connection in the settings (scroll to the bottom)
  - **OBS Studio**
    - Use `ws://localhost:4444` as Host & Port (replace `4444`  with the port you have defined in OBS Studio)
    - Add the token, if you are using a password encrypted connection (recommended!)
  - **Streamlabs OBS**
    - Within Streamlabs open the settings for remote control and click on the blurred QR code to open it
    - Click on "show details"
    - Use `http://127.0.0.1:59650/api` as Host & Port (replace `59650` with the port you have defined in Streamlabs OBS)
    - Copy your Streamlabs API token into AmongOBS
- Configure the scenes you want to switch to, based on the game status.
- Start the game and test it 😄 
- Feature me on your live streams and connect to my Discord (optional 😉 )

------------------------------------------------------------
## License

Distributed under the GNU General Public License v3.0. See `LICENSE` for more information.
Please also have a look at <a href="https://github.com/ottomated/CrewLink">CrewLink by ottomated</a>, a free, open Among Us proximity voice chat, which made this project possible.
