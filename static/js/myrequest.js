//请求类
class UrlRequest {
  async get(url, options) {
    const { params } = options;

    if (params) {
      let s = new URLSearchParams(params).toString();
      url += "?" + s;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
        },
      });
      const json_res = await response.json();
      return json_res;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async post(url, options, authorizationheaders = {}) {
    const { params, data } = options;

    if (params) {
      let s = new URLSearchParams(params).toString();
      url += "?" + s;
    }

    const bodycontent = JSON.stringify(data);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
          ...authorizationheaders,
        },
        body: bodycontent,
      });
      const json_res = await response.json();
      return json_res;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async put(url, options, authorizationheaders = {}) {
    const { params, data } = options;
    if (params) {
      let s = new URLSearchParams(params).toString();
      url += "?" + s;
    }

    const bodycontent = JSON.stringify(data);
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json;charset=utf-8",
          ...authorizationheaders,
        },
        body: bodycontent,
      });
      const json_res = await response.json();
      return json_res;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}

let urlrequest = new UrlRequest();
export { urlrequest };