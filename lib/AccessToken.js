const CustomError = require('./CustomError');
const request = require('./request');

class AccessToken {

  constructor() {
    console.log(`create AccessToken instance`);
    this._on_update = false;
    this._already_init = {};
  }

  init(config, credentials) {
    if (!this._already_init[config.region]) {
      console.log(`init Access Token instance...`);
      this._already_init[config.region] = true;
      this._access_token = config.access_token;
      this._refresh_token = config.refresh_token;
      this._credentials = credentials;
      if (!this._refresh_token){
        throw new CustomError({
          code:'NO_REFRESH_TOKEN_PROVIDED',
          message:'Please provide a refresh token'
        });
      }
    }
  }

  _constructRefreshAccessTokenBody(){
    let body = {
      grant_type:'refresh_token',
      refresh_token:this._refresh_token,
      client_id:this._credentials.id,
      client_secret:this._credentials.secret
    };
    return JSON.stringify(body);
  }

  _wait() {
    return new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });
  }

  async _resetOnUpdate() {
    await this._wait();
    console.log('set on_update to false');
    this._on_update = false;
  }

  async refreshAccessToken() {
    if (!this._on_update) {
      console.log(`refreshToken from AccessToken class`);
      this._on_update = true;
      let res = await request({
        method:'POST',
        url:'https://api.amazon.com/auth/o2/token',
        body:this._constructRefreshAccessTokenBody(),
        headers:{
          'Content-Type':'application/json'
        }
      });
      let json_res;
      try {
        json_res = JSON.parse(res.body);
      } catch (e){
        await this._resetOnUpdate();
        throw new CustomError({
          code:'REFRESH_ACCESS_TOKEN_PARSE_ERROR',
          message:res.body
        });
      }
      if (json_res.access_token){
        this._access_token = json_res.access_token;
        await this._resetOnUpdate();
      } else if (json_res.error){
        await this._resetOnUpdate();
        throw new CustomError({
          code:json_res.error,
          message:json_res.error_description
        });
      } else {
        await this._resetOnUpdate();
        throw new CustomError({
          code:'UNKNOWN_REFRESH_ACCESS_TOKEN_ERROR',
          message:res.body
        });
      }
    }
  }

  get access_token() {
    return this._access_token;
  }

};

class AccessTokenSingleton {
  constructor() {
    if (!AccessTokenSingleton.instance) {
      AccessTokenSingleton.instance = new AccessToken();
    }
  }

  getInstance() {
    return AccessTokenSingleton.instance;
  }
};

module.exports = AccessTokenSingleton;