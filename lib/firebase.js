/**
 * @providesModule Firebase
 * @flow
 */
import { NativeModules } from 'react-native';

import Log from './utils/log';
import { isObject } from './utils';

// modules
import Auth from './modules/auth';
import Storage, { statics as StorageStatics } from './modules/storage';
import Database, { statics as DatabaseStatics } from './modules/database';
import Messaging from './modules/messaging';
import Analytics from './modules/analytics';
import Crash from './modules/crash';

const instances = { default: null };
const FirebaseModule = NativeModules.RNFirebase;

/**
 * @class Firebase
 */
export default class Firebase {
  _log: ?Object;
  _auth: ?Object;
  _store: ?Object;
  _storage: ?Object;
  _database: ?Object;
  _presence: ?Object;
  _analytics: ?Object;
  _constants: ?Object;
  _messaging: ?Object;
  _remoteConfig: ?Object;
  _crash: ?Object;

  /**
   *
   * @param options
   */
  constructor(options: Object = {}) {
    this.eventHandlers = {};
    this.debug = options.debug || false;
    this.options = Object.assign({ errorOnMissingPlayServices: true }, options);

    if (this.debug) {
      Log.enable(this.debug);
    }

    this._log = new Log('firebase');

    this._auth = new Auth(this, this.options);
    if (this.options.errorOnMissingPlayServices && !this.googleApiAvailability.isAvailable) {
      throw new Error(`Google Play Services is required to run this application but no valid installation was found (Code ${this.googleApiAvailability.status}).`);
    }

    this.storage = this._staticsOrInstance('storage', StorageStatics, Storage);
    this.database = this._staticsOrInstance('database', DatabaseStatics, Database);
  }

  /**
   * Support web version of initApp.
   * @param options
   * @param name
   * @returns {*}
   */
  static initializeApp(options: Object = {}, name: string = 'default') {
    if (!isObject(options)) {
      throw new Error('Firebase.initializeApp(options <- requires a configuration object');
    }

    if (typeof name !== 'string') {
      throw new Error('Firebase.initializeApp(options, name <- requires a string value');
    }

    if (name !== 'default') {
      throw new Error('RNFirebase currently only supports one instance of firebase - the default one.');
    }

    if (!instances[name]) instances[name] = new Firebase(options);
    return instances[name];
  }

  auth() {
    return this._auth;
  }

  analytics() {
    if (!this._analytics) {
      this._analytics = new Analytics(this);
    }
    return this._analytics;
  }

  messaging() {
    if (!this._messaging) {
      this._messaging = new Messaging(this);
    }
    return this._messaging;
  }

  crash() {
    if (!this._crash) {
      this._crash = new Crash(this);
    }
    return this._crash;
  }

  get apps(): Array<string> {
    return Object.keys(instances);
  }

  /**
   * Returns androids GoogleApiAvailability status and message if available.
   * @returns {GoogleApiAvailabilityType|{isAvailable: boolean, status: number}}
   */
  get googleApiAvailability(): GoogleApiAvailabilityType {
    // if not available then return a fake object for ios - saves doing platform specific logic.
    return FirebaseModule.googleApiAvailability || { isAvailable: true, status: 0 };
  }

  /**
   * Logger
   */
  get log(): Log {
    return this._log;
  }

  /**
   *
   * @param name
   * @param statics
   * @param InstanceClass
   * @returns {function()}
   * @private
   */
  _staticsOrInstance(name, statics, InstanceClass) {
    const getInstance = () => {
      const internalPropName = `_${name}`;

      if (!this[internalPropName]) {
        this[internalPropName] = new InstanceClass(this);
      }

      return this[internalPropName];
    };

    Object.assign(getInstance, statics || {});

    return getInstance;
  }
}
