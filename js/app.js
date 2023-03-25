import MEDIA from "./media.js"; //the data file import

const APP = {
  audio: new Audio(), //the Audio Element that will play every track
  currentTrack: 0, //the integer representing the index in the MEDIA array
  init: () => {
    //called when DOMContentLoaded is triggered
    APP.loadCurrentTrack();
    APP.buildPlaylist();
    APP.loadTracks();
    APP.addListeners();
  },
  addListeners: () => {
    //add event listeners for interface elements
    document
      .querySelector(".controls")
      .addEventListener("click", APP.controlsHandler);

    document
      .querySelector(".playlist")
      .addEventListener("click", APP.clickToPlay);
    document.querySelector(".progress").addEventListener("click", (ev) => {
      APP.seek(ev);
    });
    document.querySelector("#btnShuffle").addEventListener("click", (ev) => {
      APP.shufflePlaylist();
    });
    //add event listeners for APP.audio
    APP.audio.addEventListener("error", APP.audioError);
    APP.audio.addEventListener("ended", APP.ended);
    APP.audio.addEventListener("loadstart", APP.loadstart);
    APP.audio.addEventListener("loadedmetadata", APP.loadedmetadata);
    APP.audio.addEventListener("canplay", APP.canplay);
    APP.audio.addEventListener("durationchange", APP.durationchange);
    APP.audio.addEventListener("timeupdate", (ev) => {
      APP.timeupdate();
      APP.calculatePlayedPct();
    });
    APP.audio.addEventListener("play", () => {
      APP.play();
      document.body.classList.add("playing");
      setTimeout(() => {
        document.body.classList.remove("playing");
      }, 2000);
    });
    APP.audio.addEventListener("pause", APP.pause());
  },
  buildPlaylist: () => {
    //read the contents of MEDIA and create the playlist
    const playlist = document.querySelector(".playlist");

    playlist.innerHTML = MEDIA.map(
      (item) =>
        `<li class="track__item" data-source="${item.track}">
          <div class="track__thumb">
            <img src="./../img/album-covers/${item.thumbnail}"
            alt="artist album art thumbnail"/>
          </div>
          <div class="track__details">
            <p class="track__title">${item.title}</p>
            <p class="track__artist">${item.artist}</p>
          </div>
          <div class="track__time">
          <time datetime="">00:00</time>
          </div>
        </li>`
    ).join("");
  },
  clickToPlay: (ev) => {
    APP.removeSelection();
    let audioFile = ev.target.closest("li").getAttribute("data-source");
    let index = MEDIA.findIndex((item) => item.track === audioFile);
    APP.audio.pause();
    APP.currentTrack = index;
    APP.loadCurrentTrack();
    APP.addSelection();
    APP.setPauseSign();
    APP.play();
  },
  loadAlbumCover: () => {
    document
      .querySelector(".album_art__full img")
      .setAttribute(
        "src",
        `./../img/album-covers/${MEDIA[APP.currentTrack].large}`
      );
  },
  addSelection: () => {
    document
      .querySelector(".playlist")
      .childNodes[APP.currentTrack].classList.add("selected");
  },
  removeSelection: () => {
    document
      .querySelector(".playlist")
      .childNodes[APP.currentTrack].classList.remove("selected");
  },
  loadCurrentTrack: () => {
    //use the currentTrack value to set the src of the APP.audio element
    APP.audio.src = `./../media/${MEDIA[APP.currentTrack].track}`;
    APP.loadAlbumCover();
  },
  loadTracks: () => {
    MEDIA.forEach((song) => {
      //create a temporary audio element to open the audio file
      let tempAudio = new Audio(`./../media/${song.track}`);
      //listen for the event
      tempAudio.addEventListener("durationchange", (ev) => {
        //`tempAudio` and `track` are both accessible from inside this function
        //update the array item with the duration value
        let duration = ev.target.duration;
        song["duration"] = duration;
        //update the display by finding the playlist item with the matching img src
        //or track title or track id...
        let thumbnails = document.querySelectorAll(".track__item img");
        thumbnails.forEach((thumb, index) => {
          if (thumb.src.includes(song.thumbnail)) {
            //convert the duration in seconds to a 00:00 string
            let timeString = APP.convertTimeDisplay(duration);
            //update the playlist display for the matching item
            thumb.closest(".track__item").querySelector("time").innerHTML =
              timeString;
          }
        });
      });
    });

    APP.loadAlbumCover();
  },
  controlsHandler: (ev) => {
    switch (ev.target.parentElement.id) {
      case "btnPlay":
        if (
          ev.target.parentElement.id === "btnPlay" &&
          ev.target.textContent === "play_arrow"
        ) {
          APP.setPauseSign();
          APP.play();
          APP.addSelection();
        } else {
          APP.setPlaySign();
          APP.pause();
        }
        break;

      case "btnNext":
        APP.setPauseSign();
        APP.removeSelection();
        APP.next();
        APP.loadCurrentTrack();
        APP.play();
        APP.addSelection();
        break;
      case "btnPrev":
        APP.setPauseSign();
        APP.removeSelection();
        APP.previous();
        APP.loadCurrentTrack();
        APP.play();
        APP.addSelection();
        break;
    }
  },
  play: () => {
    //start the track loaded into APP.audio playing
    if (APP.audio.src) {
      APP.audio.play();
    } else {
      console.warn("You need to load a track first");
    }
  },
  setPlaySign: () => {
    document.querySelector("#btnPlay i").textContent = "play_arrow";
  },
  setPauseSign: () => {
    document.querySelector("#btnPlay i").textContent = "pause";
  },
  pause: () => {
    //pause the track loaded into APP.audio playing
    APP.audio && APP.audio.pause();
  },
  next: () => {
    APP.audio.pause(); //stop the current track playing
    APP.currentTrack++; //increment the value
    if (APP.currentTrack >= MEDIA.length) {
      APP.currentTrack = 0;
    }
  },
  previous: () => {
    APP.audio.pause(); //stop the current track playing
    APP.currentTrack--; //increment the value
    if (APP.currentTrack < 0) {
      APP.currentTrack = MEDIA.length - 1;
    }
  },
  shufflePlaylist() {
    APP.audio.pause();
    MEDIA.shuffle();
    APP.currentTrack = 0;
    APP.loadCurrentTrack();
    APP.buildPlaylist();
    APP.loadTracks();
    APP.updateProgressBar(0);
    APP.setPlaySign();
  },
  seek(ev) {
    const progBarWidth = document.querySelector(".progress").clientWidth;
    const seekPosition = ev.x / progBarWidth;
    APP.updateProgressBar(seekPosition);
    APP.audio.currentTime = seekPosition * APP.audio.duration;
  },
  durationchange(ev) {
    document.querySelector(".total-time").textContent = APP.convertTimeDisplay(
      APP.audio.duration
    );
  },
  timeupdate(ev) {
    document.querySelector(".current-time").textContent =
      APP.convertTimeDisplay(APP.audio.currentTime);
  },
  calculatePlayedPct(ev) {
    const playedPct = APP.audio.currentTime / APP.audio.duration;
    APP.updateProgressBar(playedPct);
  },
  updateProgressBar(pct) {
    pct = pct * 100 + "vw";
    document.querySelector(".played").style.width = pct;
  },
  convertTimeDisplay: (seconds) => {
    //convert the seconds parameter to `00:00` style display
    let minutes = String(Math.floor(seconds / 60));
    let secs = String(Math.floor(seconds - minutes * 60));

    minutes = minutes.padStart(2, "0");
    secs = secs.padStart(2, "0");

    return `${minutes}:${secs}`;
  },
  audioError: () => {
    console.warn(APP.audio.src, "has an error and will not load.");
    document.querySelector(".playlist").childNodes[APP.currentTrack].innerHTML =
      "Unable to load audio file";
    document.querySelector(".album_art__full").innerHTML = "";
  },
  ended: () => {
    APP.removeSelection();
    APP.next();
    APP.loadCurrentTrack();
    APP.play();
    APP.addSelection();
  },
};

document.addEventListener("DOMContentLoaded", APP.init);
