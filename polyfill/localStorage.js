var localStorage = {};
var cache = {};

/**
 * number of stored items.
 */
localStorage.length = 0;

/**
 * returns item for passed key, or null
 *
 * @para {String} key
 *       name of item to be returned
 * @returns {String|null}
 */
localStorage.getItem = function (key) {
  if (key in cache) {
    return cache[key];
  }

  return null;
};

/**
 * sets item for key to passed value, as String
 *
 * @para {String} key
 *       name of item to be set
 * @para {String} value
 *       value, will always be turned into a String
 * @returns {undefined}
 */
localStorage.setItem = function (key, value) {
  if (typeof value === "undefined") {
    localStorage.removeItem(key);
  } else {
    if (!cache.hasOwnProperty(key)) {
      localStorage.length++;
    }

    cache[key] = "" + value;
  }
};

/**
 * removes item for passed key
 *
 * @para {String} key
 *       name of item to be removed
 * @returns {undefined}
 */
localStorage.removeItem = function (key) {
  if (cache.hasOwnProperty(key)) {
    delete cache[key];
    localStorage.length--;
  }
};

/**
 * returns name of key at passed index
 *
 * @para {Number} index
 *       Position for key to be returned (starts at 0)
 * @returns {String|null}
 */
localStorage.key = function (index) {
  return Object.keys(cache)[index] || null;
};

/**
 * removes all stored items and sets length to 0
 *
 * @returns {undefined}
 */
localStorage.clear = function () {
  cache = {};
  localStorage.length = 0;
};

async function getSnapState() {
  return await snap.request({
    method: "snap_manageState",
    params: {
      operation: "get",
    },
  });
}

async function setSnapState(state) {
  return await snap.request({
    method: "snap_manageState",
    params: {
      operation: "update",
      newState: state,
    },
  });
}

getSnapState().then(state => {
  console.log("localStorage init", { state });
  if (state["localStorage"]) {
    cache = state["localStorage"];
    localStorage.length = Object.keys(cache).length;
  }
  setInterval(async () => {
    const oldState = await getSnapState();
    const newState = { ...oldState, localStorage: cache };
    console.log("localStorage update", { oldState, newState, cache });
    await setSnapState(newState);
  }, 100);
});

exports.localStorage = localStorage;
