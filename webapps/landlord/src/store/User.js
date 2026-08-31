import { action, computed, flow, makeObservable, observable } from 'mobx';
import apiClient, { setAccessToken } from '../utils/apiClient';

export default class User {
  constructor(store) {
    this.store = store;
    this.token = undefined;
    this.firstName = undefined;
    this.lastName = undefined;
    this.email = undefined;

    makeObservable(this, {
      token: observable,
      firstName: observable,
      lastName: observable,
      email: observable,
      signedIn: computed,
      setUserFromSession: action,
      signUp: flow,
      signIn: flow,
      signOut: flow,
      forgotPassword: flow,
      resetPassword: flow,
      changePassword: flow
    });
  }

  get signedIn() {
    return !!this.token;
  }

  setUserFromSession({ firstname, lastname, email }, accessToken) {
    this.firstName = firstname;
    this.lastName = lastname;
    this.email = email;
    this.token = accessToken;
    setAccessToken(accessToken);
  }

  *signUp(firstname, lastname, email, password) {
    try {
      yield apiClient.post('/authenticator/landlord/signup', {
        firstname,
        lastname,
        email,
        password
      });
      return 200;
    } catch (error) {
      return error.response.status;
    }
  }

  *signIn(email, password) {
    try {
      yield apiClient.post('/authenticator/landlord/signin', {
        email,
        password
      });
      return 200;
    } catch (error) {
      return error.response.status;
    }
  }

  *signOut() {
    try {
      yield apiClient.delete('/authenticator/landlord/signout');
      this.firstName = undefined;
      this.lastName = undefined;
      this.email = undefined;
      this.token = undefined;
      setAccessToken(null);
      window?.sessionStorage.clear();
      return 200;
    } catch (error) {
      return error.response.status;
    }
  }

  *forgotPassword(email) {
    try {
      yield apiClient.post('/authenticator/landlord/forgotpassword', {
        email
      });
      return 200;
    } catch (error) {
      return error.response.status;
    }
  }

  *resetPassword(resetToken, password) {
    try {
      yield apiClient.patch('/authenticator/landlord/resetpassword', {
        resetToken,
        password
      });
      return 200;
    } catch (error) {
      return error.response.status;
    }
  }

  *changePassword(currentPassword, newPassword) {
    try {
      yield apiClient.patch('/authenticator/landlord/changepassword', {
        currentPassword,
        newPassword
      });
      return { status: 200 };
    } catch (error) {
      return {
        status: error.response?.status,
        error: error.response?.data?.message
      };
    }
  }
}
