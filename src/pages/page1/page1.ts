import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AlertController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { HTTP } from '@ionic-native/http';

@Component({
  selector: 'page-page1',
  templateUrl: 'page1.html'
})
export class Page1Page {
  /**
   * The time in hours used to rate limit the reports on new incidents
   */
  private timeLimit: number;
  /**
   * The distance in kilometres used to rate limit the reports on new incindents.
   * This will be used in combination with the timeLimit in order to succeed a
   * logical combination while limiting remote requests to the FETS service.
   */
  private distanceLimi: number;
  /**
   * The API endpoint URL
   */
  private url: string;

  constructor(public navCtrl: NavController, public alertCtrl: AlertController,
    private storage: Storage, private geolocation: Geolocation, private http: HTTP) {
    this.timeLimit = 1;
    this.url = 'http://fets.stefk.me/api/v1/alerts/create';
  }

  /**
   * Loads user's stored phone number
   * @returns {Promise} any
   */
  loadPhoneNumber(): any {
    return this.storage.get('phoneNumber').then((phoneNumber) => {
      return phoneNumber;
    })
  }

  /**
   * Loads last reported incident's coordinates
   * @returns {Promise} any lat-lon object
   */
  loadLastReportedCoordinates():any {
    return this.storage.get('lat').then((lat) => {
      return this.storage.get('lon').then((lon) => {
        return {'lat': lat, 'lon': lon}
      })
    })
  }

  /**
   * Converts numeric values to radians
   * @param {number} num radian result
   */
  private toRad(num: number): number {
    return num * Math.PI / 180;
  }

  /**
   * Calculates the distance between two points
   * @param {number} currentLat The current latitude of the device
   * @param {number} currentLon The current longitude of the device
   * @param {number} reportedLat Latitude where the last incindent was reported
   * @param {number} reportedLon Longitude where the last incindent was reported
   * @returns {number} The distance between the two points in kilometres
   */
  getDistanceBetweenPoints(currentLat: number, currentLon: number, reportedLat: number, reportedLon: number): number {
    let earthRadius = 6371;
    // numeric to radian
    let dLat = this.toRad(currentLat - reportedLat)
    let dLon = this.toRad(currentLon - reportedLon)
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(currentLat)) * Math.cos(this.toRad(reportedLat)) *
      Math.sin(dLon / 2) * Math.sin(dLat / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // distance is in kilometres
    return earthRadius * c;
  }

  /**
   * Check if an incindent has been reported in the last hour.
   * If yes return false indicating that it is too soon to report again.
   */
  checkLastReportedIncindent() {
    return this.storage.get('reportedAt').then((val) => {
      if (val) {
        let now = +new Date();
        let last = +Date.parse(val)
        let diff = now - last;
        diff = (diff / (1000 * 60 * 60)) % 24
        return diff >= this.timeLimit
      }
    })
  }

  /**
   * Records the last responded incindent
   * @param {number} currentLat  Current latitude
   * @param {number} currentLon Current longitude
   */
  recordNewIncindent(currentLat: number, currentLon: number) {
    this.storage.set('lat', currentLat)
    this.storage.set('lon', currentLon)
    this.storage.set('reportedAt', new Date())
  }

  /**
   * Get current coordinates
   */
  getCoordinates(): any {
    let options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    }
    return this.geolocation.getCurrentPosition(options).then((val) => {
      return { lat: val.coords.latitude, lon: val.coords.longitude }
    }).catch((error) => {
      this.showAlert('Δεν ήταν δυνατό να εντοπίσουμε τη θέση σας με χρήση του GPS, παρακαλούμε βεβαιωθείτε ότι το GPS είναι ενεργοποιημένο.')
    })
  }

  /**
   * Executes the remote API call to the service in order to report the incindent
   * @param {number} currentLat Current latitude of the device
   * @param currentLon Current longitude of the device
   * @param phoneNumber User's cellphone number
   */
  remoteReportIncindent(currentLat: number, currentLon: number, phoneNumber: string) {
    this.http.post(this.url, {'phonenumber': phoneNumber, 'lat': currentLat, 'lon': currentLon}, {}).then((res) => {
      this.recordNewIncindent(currentLat, currentLon)
      this.showAlert(`Το συμβάν, αναφέρθηκε με επιτυχία.
Προσωπικό της υπηρεσίας μας, θα σας καλέσει για περαιτέρω
λεπτομέρειες επι του συμβάντος, ευχαριστούμε για την προσφορά σας.`)
    }).catch((error) => {
      this.showAlert('Δεν ήταν δυνατό να ενημερωθεί η υπηρεσία για το συμβάν, παρακαλούμε προσπαθήστε σε λίγο.')
    })
  }

  /**
   * Gathers all needed data and checks if we are ok to report the incindent
   */
  reportIncindent() {
    this.loadPhoneNumber().then((phone) => {
      this.checkLastReportedIncindent().then((notReported) => {
        if (notReported) {
          this.getCoordinates().then((coords) => {
            // do the actual API call
            this.remoteReportIncindent(coords.lat, coords.lon, phone)
          })
        } else {
          this.showAlert('Έχετε ήδη αναφέρει το συμβάν!')
        }
      })
    })
  }

  /**
 * Show and alert modal box with a custom message
 * @param {string} msg Message to display
 */
  showAlert(msg) {
    let alert = this.alertCtrl.create({
      title: 'ΑΝΑΦΟΡΑ ΣΥΜΒΑΝΤΟΣ',
      subTitle: msg,
      buttons: ['ΚΛΕΙΣΙΜΟ']
    });
    alert.present()
  }
}
