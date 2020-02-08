import { Map, fromJS } from "immutable";
import { includes } from "ramda";
import { fromEvent } from "rxjs";

// initialize store
const initialStore = Map({
    apod: null,
    roverPhotos: null,
    selectedRover: null,
    selectedSol: 0,
    roversManifest: null,
    rovers: ["curiosity", "opportunity", "spirit"],
});

const root = document.getElementById(
    "root");

const updateStore = (store, newStore) => {
    let prevStore = fromJS(store);
    render(root, prevStore.merge(newStore).toJS());
};

const render = (root, store) => {
    root.innerHTML = App(store);
    attachListeners(store);
};

// create content
const App = (store) => {
    let { rovers, apod, roversManifest, selectedRover } = store;

    //return gallery or dashboard on selection
    if (roversManifest) {
        return `
        ${ MakeHeader(rovers, selectedRover) }
        ${ selectedRover ? SetGallery(store) : ImageOfTheDay(apod, store) + SetRovers(roversManifest, store)}
        ${addFooter()}`;
    }
    else {
        getRoverManifest(store);
        return ShowLoader();
    }
};

// listening for load event because page should load before any JS is called
window.addEventListener("load", () => {
    render(root, initialStore);
});

// attach event listeners when dom is rendered
const attachListeners = (store) => {
    if (store.roversManifest) {
        for (let elm of document.getElementsByClassName("rover-nav")){
            fromEvent(elm,"click").subscribe( (event) => {
                if (event.target && event.target.dataset) {
                    let rover = event.target.dataset.value;
                    if (includes(rover, store.rovers)) {
                        let selectedRover = store.roversManifest
                            .filter(item => item.name.toLowerCase() === rover);
                        let roverMaxSol = selectedRover.reduce((acc, item) => item.max_sol, 0);
                        updateStore(store, { selectedRover: rover, roverMaxSol, selectedSol: roverMaxSol, roverPhotos: "" });
                    }
                    else {
                        updateStore(store, { selectedRover: null, selectedSol: null, roverPhotos: "" });
                    }
                }
            });
        }
    }

    if (store.roverPhotos) {
        fromEvent(document.getElementById("nextSol"), "click").subscribe( () => {
            updateStore(store, { selectedSol: store.selectedSol+1, roverPhotos: "" });
        });

        fromEvent(document.getElementById("previousSol"), "click").subscribe( () => {
            updateStore(store, { selectedSol: store.selectedSol-1, roverPhotos: "" });
        });
    }
};

// ------------------------------------------------------  COMPONENTS

const ShowLoader = () => {
    return `
            <div class="sk-circle">
              <div class="sk-circle1 sk-child"></div>
              <div class="sk-circle2 sk-child"></div>
              <div class="sk-circle3 sk-child"></div>
              <div class="sk-circle4 sk-child"></div>
              <div class="sk-circle5 sk-child"></div>
              <div class="sk-circle6 sk-child"></div>
              <div class="sk-circle7 sk-child"></div>
              <div class="sk-circle8 sk-child"></div>
              <div class="sk-circle9 sk-child"></div>
              <div class="sk-circle10 sk-child"></div>
              <div class="sk-circle11 sk-child"></div>
              <div class="sk-circle12 sk-child"></div>
            </div>`;
};

const SetGallery = (store) => {
    let { selectedRover, roverMaxSol, selectedSol, roverPhotos } = store;
    if (!roverPhotos){
        getRoverPhotos(selectedRover, selectedSol, store);
        return ShowLoader();
    }
    else {
        return `
        <div class="container gallery">

            <div class="row">
                <h2>Rover "${selectedRover}" photos of Sol ${selectedSol}</h2>
            </div>
            <div class="row">
            ${roverPhotos.map((photo) => {
                return (`
                    <a href="${photo.img_src}" data-toggle="lightbox" data-gallery="gallery" class="col-md-4 margin10" data-key="${photo.id}">
                      <img src="${photo.img_src}" class="img-fluid rounded">
                    </a>
                `);
            }).join("")}
            </div>
            <div class="btn-group float-right" role="group" aria-label="Basic example">
                <button type="button" id="nextSol" class="btn btn-secondary" ${selectedSol+1>roverMaxSol ? 'disabled' : ''}>
                    ${selectedSol+1>roverMaxSol ? 'Max Sol' : 'Sol ' + (selectedSol+1)}
                </button>
                <button type="button" class="btn btn-secondary" id="previousSol">Sol ${selectedSol-1}</button>
            </div>
        </div>
    `;
    }
};


const MakeHeader = (rovers, selectedRover) => {
    return (`
        <header>
            <nav class="navbar navbar-expand-md fixed-top navbar-dark bg-secondary">
                <a class="navbar-brand" href="#">Mission Mars</a>
                <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarCollapse">
                    <ul class="navbar-nav mr-auto rover-nav">
                        <li class="nav-item ${!selectedRover ? 'active' : ''}">
                            <a class="nav-link" href="#">Dashboard <span class="sr-only">(current)</span></a>
                        </li>
                        ${rovers.map((rover) => (`
                                <li class="nav-item mt-2 mt-md-0">
                                    <a class="nav-link ${selectedRover === rover ? 'active' : ''}" data-value="${rover}">
                                        ${rover.charAt(0).toUpperCase() + rover.slice(1)}
                                        </a>
                                </li>`
                        )).join("")}
                    </ul>
                </div>
            </nav>
        </header>
    `);
};


const ImageOfTheDay = (apod, store) => {

    if (!apod || !apod.image) {
        getImageOfTheDay(store);
        return ShowLoader();
    }
    else {
        let { image } = apod;
        return image["media_type"] === "video" ? (`
            <div id="myCarousel" class="carousel slide" data-ride="carousel">
                <div class="carousel-inner">
                    <div class="carousel-item active">
                        <div class="view">
                            <div class="video-container">
                                <iframe src="${image.url}&autoplay=1&loop=1&controls=0" frameborder="0" allowfullscreen ></iframe>
                            </div>
                        </div>
                        <div class="carousel-caption">
                            <div class="animated fadeInDown">
                              <p>NASA - Astronomy Video Of the Day</p>
                              <h3 class="h3-responsive">${image.title}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `) :(`
            <div id="myCarousel" class="carousel slide" data-ride="carousel">
                <div class="carousel-inner">
                    <div class="carousel-item active">
                        <img class="first-slide" src="${image.url}" alt="First slide">
                        <div class="container">
                            <div class="carousel-caption text-left">
                                <p>NASA - Astronomy Picture Of the Day</p>
                                <h1>${image.title}</h1>
                                <p class="md-col-12 explanation" style="font-size: medium;">${image.explanation}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
};

const SetRovers = (roversManifest, store) => {

    if (!roversManifest) {
        getRoverManifest(store);
    }
    else {
        return (`
        <div class="container marketing">
            <div class="text-align-center">
                <h2>The Rovers Of Mars</h2>
            </div>
            <hr />
            <div class="row">
            ${roversManifest.map((rover)=>{
                return (`<div class="col-lg-4 table-responsive">
                            <table class="table table-dark">
                              <thead>
                                <tr class="bg-light">
                                  <th style="padding: 70px 0; color: #333333;">
                                    ${rover.name} is ${rover.status === 'active' ? '<span class="onlineColor">Online</span>' : 'Offline'}
                                  </th>
                                  <th>
                                    <img class="img-thumbnail rounded" src="${rover.status === 'active' ? 'assets/img/rover-active.png' : 'assets/img/rover-inactive.png'}" alt="rover image" width="140" height="140">
                                  </th>
                                </tr>
                                <tr>
                                  <th scope="col">Name</th>
                                  <th scope="col">${rover.name}</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>Landing Date</td>
                                  <td>${rover.landing_date}</td>
                                </tr>
                                <tr>
                                  <td>Launch Date</td>
                                  <td>${rover.launch_date}</td>
                                </tr>
                                <tr>
                                  <td>Status</td>
                                  <td>${rover.status}</td>
                                </tr>
                                <tr>
                                  <td>Total Sol</td>
                                  <td>${rover.max_sol}</td>
                                </tr>
                                <tr>
                                  <td>Total Photos</td>
                                  <td>${rover.total_photos}</td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td>
                                        <button type="button" class="btn btn-link rover-nav" data-value="${rover.name.toLowerCase()}">View Photos &raquo;</button>
                                    </td>
                                </tr>
                              </tbody>
                            </table>
                        </div>`);
            }).join('')}
            </div>
        </div>
    `);
    }
};

const addFooter = () => {
    return (`
        <footer class="container">
            <p>&copy; 2020 <a href="https://linkedin.com/in/jsalaat" rel="noopener" target="_blank">JSalaat</a> </p>
        </footer>
    `);
};

// ------------------------------------------------------  API CALLS

// get APOD API call
const getImageOfTheDay = (store) => {
    fetch(`http://localhost:3000/apod`)
        .then(res => res.json())
        .then(apod => updateStore(store, { apod }));

};

// Get manifest API call
const getRoverManifest = (store) => {
    fetch(`http://localhost:3000/roverData/manifests`)
        .then(res => res.json())
        .then(({ roversManifest }) => {
            updateStore(store, { roversManifest: roversManifest.map(r => r['photo_manifest']) });
        });
};


// get rover photos API call
const getRoverPhotos = (selectedRover, sol, store) => {
    fetch(`http://localhost:3000/photos/${selectedRover}/${sol}`)
        .then(res => res.json())
        .then(({ photos }) => {
            updateStore(store, { roverPhotos : photos });
        });
};

// lightbox initialization and conf for gallery images
$(document).on("click", '[data-toggle="lightbox"]', function(event) {
    event.preventDefault();
    $(this).ekkoLightbox({
        showArrows: false,
    });
});
