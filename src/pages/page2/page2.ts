import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { AlertController } from 'ionic-angular';

@Component({
  selector: 'page-page2',
  templateUrl: 'page2.html'
})
export class Page2Page {

  /**
   * User's cellphone number
   */
  public phoneNumber: string;

  constructor(public navCtrl: NavController, public alertCtrl: AlertController, private storage: Storage) {
    this.loadSettings()
  }

  /**
   * Load user's phone number from settings
   */
  loadSettings() {
    this.storage.get('phoneNumber').then((val) => {
      if (val) {
        this.phoneNumber = val
      }
    })
  }

  /**
   * Save user's phone number
   */
  savePhoneNumber() {
    let msg = this.validatePhone(this.phoneNumber)
    if (msg === null) {
      this.storage.set('phoneNumber', this.phoneNumber)
      this.showAlert('Ο αριθμός σας, αποθηκεύτηκε με επιτυχία.')
    } else {
      this.showAlert(msg)
    }
  }

  /**
   * Validate user's phone number and return any error messages
   * @param {string} phoneNumber User's input for the phone number
   */
  validatePhone(phoneNumber):string {
    let msg = null
    let alldigits = /^\d+$/
    if (phoneNumber.length != 10) {
      msg = 'Το μήκος του αριθμού, δεν είναι έγκυρο!'
    }
    if (!phoneNumber.startsWith('69') || !alldigits.test(phoneNumber)) {
      if (msg !== null) {
        msg += 'Ο αριθμός δεν είναι έγκυρος!'
      } else {
        msg = 'Ο αριθμός δεν είναι έγκυρος!'
      }
    }
    return msg
  }

  /**
   * Show and alert modal box with a custom message
   * @param {string} msg Message to display
   */
  showAlert(msg) {
    let alert = this.alertCtrl.create({
      title: 'ΑΠΟΘΗΚΕΥΣΗ ΑΡΙΘΜΟΥ',
      subTitle: msg,
      buttons: ['ΚΛΕΙΣΙΜΟ']
    });
    alert.present()
  }
}
