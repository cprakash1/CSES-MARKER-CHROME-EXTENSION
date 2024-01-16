/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/leafstore-db/index.js":
/*!********************************************!*\
  !*** ./node_modules/leafstore-db/index.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _src_leafstore_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./src/leafstore.js */ "./node_modules/leafstore-db/src/leafstore.js");


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_src_leafstore_js__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./node_modules/leafstore-db/src/document.js":
/*!***************************************************!*\
  !*** ./node_modules/leafstore-db/src/document.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _model_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./model.js */ "./node_modules/leafstore-db/src/model.js");
// const LeafstoreModel = require("./model");


/**
 * @template {Record<string, any>} T
 * @class
 */
class LeafstoreDocument {
  /**
   * Creates a Leafstore document. This class is not meant to be instantiated directly.
   * {@link LeafstoreModel} will call this class automatically for you.
   *
   * @param {T} object
   * @param {LeafstoreModel<T>} model
   * @param {Boolean} [isNew=true]
   */
  constructor(object, model, isNew = true) {
    this._object = object;
    this._model = model;
    this._isNew = isNew;

    this.#addGettersAndSetters();
  }

  /**
   * Adds getters and setters to the document
   */
  #addGettersAndSetters() {
    /** @type {Record<keyof T, any>} */
    const schema = this._model._schema._schema;
    const privateFields = ["_key"];

    for (let key in schema) {
      if (this._object.hasOwnProperty(key)) {
        // add only getters for private fields
        if (privateFields.includes(key)) {
          Object.defineProperty(this, key, {
            get() {
              return this._object[key];
            },
          });
          continue;
        }
        // add getters and setters
        Object.defineProperty(this, key, {
          get() {
            return this._object[key];
          },
          set(value) {
            this._isNew = true;
            this._object[key] = value;
          },
        });
      }
    }
  }

  /**
   * @returns {String}
   */
  toString() {
    return JSON.stringify(this._object);
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return this._object;
  }

  /**
   * Saves the document to the database. If the document is new, it will be created.
   * @returns {Promise<LeafstoreDocument<T>>}
   */
  async save() {
    if (!this._isNew) {
      return this;
    }
    return new Promise((resolve, reject) => {
      try {
        this._model.insertOne(this._object, this._object._key).then((document) => {
          this._object = document._object;
          this._isNew = false;
          resolve(this);
        }).catch((error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

// module.exports = LeafstoreDocument;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (LeafstoreDocument);


/***/ }),

/***/ "./node_modules/leafstore-db/src/leafstore.js":
/*!****************************************************!*\
  !*** ./node_modules/leafstore-db/src/leafstore.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _schema_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./schema.js */ "./node_modules/leafstore-db/src/schema.js");
/* harmony import */ var _model_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./model.js */ "./node_modules/leafstore-db/src/model.js");
// const LeafstoreSchema = require("./schema.js");
// const LeafstoreModel = require("./model.js");



class leafstore {
  /**
   * Creates a leafstore database
   * @param {String} dbName
   */
  constructor(dbName) {
    if (!dbName) throw new Error("dbName is required");
    if (typeof dbName !== "string") throw new Error("dbName must be a string");
    /** @type {String} */
    this.dbName = dbName;
    /** @type {IDBDatabase | null} */
    this._db = null;
    /** @type {Record<string, LeafstoreModel>} */
    this._models = {};
    /** @type {Number} */
    this.version = 1;
  }

  static SchemaTypes = {
    String: "string",
    Number: "number",
    Boolean: "boolean",
    Date: "date",
    Array: "array",
    Object: "object",
  };

  /**
   * @typedef {Object} LeafstoreConnectOptions
   * @property {Number} [version] - The version of the database.
   * @property {Function} [onUpgrade] - A function to run when the database is upgraded.
   */

  /**
   * Connects to the database. This method must be called before using the database.
   * This method will create the database if it doesn't exist, and upgrade it if the version is different.
   * Make sure to define all your models before calling this method.
   * @param {LeafstoreConnectOptions} options - optional
   * @returns {Promise<leafstore>}
   */
  async connect(
    options = {
      version: 1,
      onUpgrade: () => {},
    }
  ) {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(
        this.dbName,
        options.version || this.version
      );
      request.onupgradeneeded = (e) => {
        this._db = request.result;

        // create object store for schemas
        const schemaStore = this._db.createObjectStore("schemas", {
          keyPath: "name",
        });
        schemaStore.createIndex("name", "name", { unique: true });

        // store schemas in the database
        for (let key in this._models) {
          if (this._models.hasOwnProperty(key)) {
            schemaStore.add({
              name: key,
              schema: this._models[key]._schema._rawSchema,
            });
          }
        }

        // create object stores for models
        for (let key in this._models) {
          if (this._models.hasOwnProperty(key)) {
            this.#generateObjectStore(this._models[key]);
          }
        }

        if (typeof options.onUpgrade === "function") {
          options.onUpgrade(this);
        }
      };
      request.onsuccess = (e) => {
        this._db = request.result;
        this.version = this._db.version;

        // get schemas from database
        const transaction = this._db.transaction("schemas", "readonly");
        const schemaStore = transaction.objectStore("schemas");
        const schemaRequest = schemaStore.getAll();
        schemaRequest.onsuccess = (e) => {
          const schemas = schemaRequest.result;
          for (let schema of schemas) {
            this._models[schema.name] = new _model_js__WEBPACK_IMPORTED_MODULE_1__["default"](
              schema.name,
              new _schema_js__WEBPACK_IMPORTED_MODULE_0__["default"](schema.schema),
              {
                db: this._db,
              }
            );
          }
        };

        // assign db to models
        for (let key in this._models) {
          if (this._models.hasOwnProperty(key)) {
            this._models[key]._db = this._db;
          }
        }

        resolve(this);
      };
      request.onerror = (e) => {
        reject(request.error);
      };
    });
  }

  /**
   * Generates an object store for a model
   * @param {LeafstoreModel} model
   * @returns {void}
   */
  #generateObjectStore(model) {
    const { _objectStoreName: objectStoreName, _schema } = model;

    if (!this._db) throw new Error("Database is not connected");

    const objectStore = this._db.createObjectStore(objectStoreName, {
      keyPath: "_key",
    });
    // create indexes for object store fields
    this.#generateIndexes(objectStore, _schema);
  }

  /**
   * Generates indexes for an object store
   * @param {IDBObjectStore} objectStore - The object store to generate indexes for
   * @param {LeafstoreSchema} schema - The schema of the object store
   * @returns {void}
   */
  #generateIndexes(objectStore, schema) {
    const _schema = schema._schema;
    // flatten the object
    // don't flatten arrays
    const flatten = (obj, prefix = "") =>
      Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? `${prefix}.` : "";
        if (
          typeof obj[k] === "object" &&
          (obj[k]._type === null || obj[k]._type === undefined)
        )
          assign(acc, flatten(obj[k], `${pre + k}`));
        else acc[`${pre + k}`] = obj[k];
        return acc;
      }, {});

    const assign = (obj, src) => {
      Object.keys(src).forEach((key) => (obj[key] = src[key]));
      return obj;
    };

    const flattenedSchema = flatten(_schema);

    for (let key in flattenedSchema) {
      if (flattenedSchema.hasOwnProperty(key)) {
        const value = flattenedSchema[key];
        // create index for field if unique
        if (value?._unique) {
          objectStore.createIndex(key, key, { unique: true });
        }
      }
    }
  }

  /**
   * @typedef {Object} LeafstoreSchemaOptions
   */

  /**
   * creates a leafstore schema
   * @template {Record<string, any>} T
   * @param {T & { _key: string }} object
   * @param {LeafstoreSchemaOptions} options - optional
   * @returns {LeafstoreSchema<T & { _key: string }>}
   */
  static Schema(object, options = {}) {
    if (!object) throw new Error("schema object is required");
    if (typeof object !== "object")
      throw new Error("schema object must be of type 'object'");

    return new _schema_js__WEBPACK_IMPORTED_MODULE_0__["default"](object, options);
  }

  /**
   * creates a leafstore model
   * @template {Record<string, any>} T
   * @param {String} name
   * @param {LeafstoreSchema<T>} schema
   * @returns {LeafstoreModel<T>}
   */
  Model(name, schema) {
    if (!name) throw new Error("Name is required");
    if (typeof name !== "string") throw new Error("Name must be a string");
    if (this._models[name]) return this._models[name];
    if (!schema) throw new Error("Schema is required");
    if (!(schema instanceof _schema_js__WEBPACK_IMPORTED_MODULE_0__["default"])) {
      throw new Error("schema must be an instance of LeafstoreSchema");
    }

    // pluralise name for object store name
    const pluralise = (word) => {
      if (word.endsWith("s")) return word;
      return word + "s";
    };
    const objectStoreName = pluralise(name.toLowerCase());

    // TODO: create a model
    this._models[name] = new _model_js__WEBPACK_IMPORTED_MODULE_1__["default"](name, schema, {
      db: this._db,
      objectStoreName,
    });

    return this._models[name];
  }
}

// module.exports = leafstore;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (leafstore);


/***/ }),

/***/ "./node_modules/leafstore-db/src/model.js":
/*!************************************************!*\
  !*** ./node_modules/leafstore-db/src/model.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _schema_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./schema.js */ "./node_modules/leafstore-db/src/schema.js");
/* harmony import */ var _document_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./document.js */ "./node_modules/leafstore-db/src/document.js");
// const LeafstoreSchema = require("./schema.js");
// const LeafstoreDocument = require("./document.js");



/**
 * @typedef {Object} LeafstoreModelConfig
 * @property {IDBDatabase | null} [db] - The database to use.
 * @property {String | null} [objectStoreName] - The name of the object store.
 */

/**
 * @template {Record<string, any>} T
 * @class
 */
class LeafstoreModel {
  /**
   * Creates a leafstore model
   * @param {String} name
   * @param {LeafstoreSchema<T>} schema
   * @param {LeafstoreModelConfig} config - optional
   */
  constructor(
    name,
    schema,
    config = {
      db: null,
      objectStoreName: null,
    }
  ) {
    if (!name) throw new Error("Name is required");
    if (typeof name !== "string") throw new Error("Name must be a string");
    if (!schema) throw new Error("Schema is required");
    if (!(schema instanceof _schema_js__WEBPACK_IMPORTED_MODULE_0__["default"])) {
      throw new Error("schema must be an instance of LeafstoreSchema");
    }
    this.name = name;
    this._schema = schema;
    this._db = config.db;
    this._objectStoreName = config.objectStoreName || name.toLowerCase();
    this._deletedKeys = []; // keys of deleted documents - acts as a cache until the document is actually deleted
  }

  /**
   * Creates a new document
   * @param {Object} object
   * @returns {Promise<LeafstoreDocument<T>>}
   */
  async create(object) {
    // wait for the database to connect
    return new Promise((resolve, reject) => {
      try {
        if (!this._db) throw new Error("Database is not connected");
        // validate and cast object
        this._schema.validate(object);
        object = this._schema.cast(object);
        // add unique key to object
        this.#addUniqueKey(object);
        // create object
        const transaction = this._db.transaction(
          this._objectStoreName,
          "readwrite"
        );
        const objectStore = transaction.objectStore(this._objectStoreName);
        const request = objectStore.add(object);
        request.onsuccess = (e) => {
          resolve(new _document_js__WEBPACK_IMPORTED_MODULE_1__["default"](object, this, false));
        };
        request.onerror = (e) => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Inserts a document. If the document already exists, it is updated.
   * @param {Object} object
   * @param {String} key
   * @returns {Promise<LeafstoreDocument<T>>}
   */
  async insertOne(object, key) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._db) throw new Error("Database is not connected");
        // validate and cast object
        this._schema.validate(object);
        object = this._schema.cast(object);
        // add unique key to object if not provided
        // it means the object is new
        if (!key && !object._key) {
          this.#addUniqueKey(object);
          key = object._key;
        }
        // create object
        const transaction = this._db.transaction(
          this._objectStoreName,
          "readwrite"
        );
        const objectStore = transaction.objectStore(this._objectStoreName);
        const request = objectStore.put(object);
        request.onsuccess = (e) => {
          resolve(new _document_js__WEBPACK_IMPORTED_MODULE_1__["default"](object, this, false));
        };
        request.onerror = (e) => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Finds a document by its primary key
   * @param {String} key
   * @returns {Promise<LeafstoreDocument<T> | null>}
   */
  async findByKey(key) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._db) throw new Error("Database is not connected");

        if (!key) throw new Error("Key is required");
        const transaction = this._db.transaction(
          this._objectStoreName,
          "readonly"
        );
        const objectStore = transaction.objectStore(this._objectStoreName);
        const request = objectStore.get(key);
        request.onsuccess = (e) => {
          let result = request.result;
          if (result) {
            [result] = this.#filterDeleted([result]);
            if (result) {
              return resolve(new _document_js__WEBPACK_IMPORTED_MODULE_1__["default"](result, this, false));
            }
          }
          resolve(null);
        };
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Finds the first document matching the query.
   * If no query is provided, the first document to come up is returned.
   * Order is not guaranteed.
   * @param {Object | IDBValidKey | IDBKeyRange | null} [query] - The query to match.
   * @returns {Promise<LeafstoreDocument<T> | null>}
   */
  async findOne(query) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._db) throw new Error("Database is not connected");

        // Optimisation for primary key queries
        let objectStoreName = this._objectStoreName;
        let idbQuery = null;
        if (typeof query === "string") {
          idbQuery = query;
        }
        // optimisation ends
        const transaction = this._db.transaction(objectStoreName, "readonly");
        const objectStore = transaction.objectStore(this._objectStoreName);
        const request = objectStore.getAll(idbQuery);
        request.onsuccess = (e) => {
          const result = request.result;
          if (result) {
            const document = this.#parseQuery(query, result, true);
            if (document) {
              resolve(new _document_js__WEBPACK_IMPORTED_MODULE_1__["default"](document, this, false));
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
        request.onerror = (e) => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Finds all documents matching the query
   * if no query is provided, all documents are returned
   * @param {Object | IDBValidKey | IDBKeyRange | null} [query] - The query to match.
   * @returns {Promise<LeafstoreDocument<T>[]>}
   * @example
   * // find all documents
   * const documents = await User.find();
   *
   * // find all documents with the name 'John Doe'
   * const documents = await User.find({ name: 'John Doe' });
   *
   * // find all documents with the name 'John Doe' and age 20
   * const documents = await User.find({ name: 'John Doe', age: 20 });
   *
   * // find all documents with the name 'John Doe' and age greater than 20
   * const documents = await User.find({ name: 'John Doe', age: { $gt: 20 } });
   */
  async find(query) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._db) throw new Error("Database is not connected");

        // Optimisation for primary key queries
        let objectStoreName = this._objectStoreName;
        let idbQuery = null;
        if (typeof query === "string") {
          idbQuery = query;
        }
        // optimisation ends
        const transaction = this._db.transaction(objectStoreName, "readonly");
        const objectStore = transaction.objectStore(this._objectStoreName);
        const request = objectStore.getAll(idbQuery);
        request.onsuccess = (e) => {
          const result = request.result;
          if (result) {
            const documents = this.#parseQuery(query, result);
            resolve(
              documents.map(
                (object) => new _document_js__WEBPACK_IMPORTED_MODULE_1__["default"](object, this, false)
              )
            );
          } else {
            resolve([]);
          }
        };
        request.onerror = (e) => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Deletes a document by its primary key
   * @param {String} key
   * @returns {Promise<void>}
   */
  async findByKeyAndDelete(key) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._db) throw new Error("Database is not connected");

        if (!key) throw new Error("Key is required");
        const transaction = this._db.transaction(
          this._objectStoreName,
          "readwrite"
        );
        const objectStore = transaction.objectStore(this._objectStoreName);
        const request = objectStore.delete(key);
        request.onsuccess = () => {
          resolve();
        };
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Deletes the first document matching the query
   * @param {Object | IDBValidKey | IDBKeyRange | null} [query] - The query to match.
   * @returns {Promise<void>}
   */
  async deleteOne(query) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._db) throw new Error("Database is not connected");

        // Optimisation for primary key queries
        let objectStoreName = this._objectStoreName;
        let idbQuery = null;
        if (typeof query === "string") {
          idbQuery = query;
        }
        // optimisation ends
        const transaction = this._db.transaction(
          this._objectStoreName,
          "readwrite"
        );
        const objectStore = transaction.objectStore(this._objectStoreName);
        const request = objectStore.getAll(idbQuery);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            const document = this.#parseQuery(query, result, true);
            if (document) {
              const key = document._key;
              // delete document
              this.#deleteByKey(key);
            }
          }
          resolve();
        };
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Deletes all documents matching the query
   * @param {Object | IDBValidKey | IDBKeyRange | null} [query] - The query to match.
   * @returns {Promise<void>}
   */
  async deleteMany(query) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._db) throw new Error("Database is not connected");

        // Optimisation for primary key queries
        let objectStoreName = this._objectStoreName;
        let idbQuery = null;
        if (typeof query === "string") {
          idbQuery = query;
        }
        // optimisation ends
        const transaction = this._db.transaction(
          this._objectStoreName,
          "readwrite"
        );
        const objectStore = transaction.objectStore(this._objectStoreName);
        const request = objectStore.getAll(idbQuery);
        request.onsuccess = (e) => {
          const result = request.result;
          if (result) {
            const documents = this.#parseQuery(query, result);
            const keys = documents.map((document) => document._key);
            // delete documents
            this.#deleteByKeys(keys);
          }
          resolve();
        };
        request.onerror = (e) => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Deletes all documents
   * @returns {Promise<void>}
   */
  async deleteAll() {
    return new Promise((resolve, reject) => {
      try {
        if (!this._db) throw new Error("Database is not connected");

        const transaction = this._db.transaction(
          this._objectStoreName,
          "readwrite"
        );
        const objectStore = transaction.objectStore(this._objectStoreName);
        const request = objectStore.clear();
        request.onsuccess = (e) => {
          resolve();
        };
        request.onerror = (e) => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Updates a document by its primary key
   * @param {String} key
   * @param {Object} object
   * @returns {Promise<LeafstoreDocument<T>>}
   */
  async findByKeyAndUpdate(key, object) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._db) throw new Error("Database is not connected");

        if (!key) throw new Error("Key is required");
        if (!object) throw new Error("update object is required");
        if (typeof object !== "object") {
          throw new Error("update object must be an object");
        }
        // get original object
        const transaction = this._db.transaction(
          this._objectStoreName,
          "readwrite"
        );
        const objectStore = transaction.objectStore(this._objectStoreName);
        const request = objectStore.get(key);
        request.onsuccess = (e) => {
          let result = request.result;
          [result] = this.#filterDeleted([result]);
          if (result) {
            let updatedObject = {
              ...result,
              ...(object || {}),
            };
            // validate and cast updated object
            this._schema.validate(updatedObject);
            updatedObject = this._schema.cast(updatedObject);
            // add original key to object
            updatedObject._key = key;
            // update object
            // no need to pass key since it is already in the object
            // MDN: If the object store uses in-line keys and key is specified,
            // DataError is thrown.
            const updateRequest = objectStore.put(updatedObject);
            updateRequest.onsuccess = () => {
              resolve(new _document_js__WEBPACK_IMPORTED_MODULE_1__["default"](updatedObject, this, false));
            };
            updateRequest.onerror = () => {
              reject(updateRequest.error);
            };
          } else {
            reject(new Error(`No document found with key '${key}'`));
          }
          resolve(new _document_js__WEBPACK_IMPORTED_MODULE_1__["default"](object, this, false));
        };
        request.onerror = (e) => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Updates the first document matching the query
   * @param {Object | IDBValidKey | IDBKeyRange | null} query - The query to match.
   * @param {Object} object
   * @returns {Promise<LeafstoreDocument<T>>}
   */
  async updateOne(query, object) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._db) throw new Error("Database is not connected");

        if (!object) throw new Error("update object is required");
        if (typeof object !== "object") {
          throw new Error("update object must be an object");
        }
        // Optimisation for primary key queries
        let objectStoreName = this._objectStoreName;
        let idbQuery = null;
        if (typeof query === "string") {
          idbQuery = query;
        }
        // optimisation ends
        const transaction = this._db.transaction(
          this._objectStoreName,
          "readwrite"
        );
        const objectStore = transaction.objectStore(this._objectStoreName);
        const request = objectStore.getAll(idbQuery);
        request.onsuccess = (e) => {
          const result = request.result;
          if (result) {
            const document = this.#parseQuery(query, result, true);
            if (document) {
              const key = document._key;
              let updatedObject = {
                ...document,
                ...(object || {}),
              };
              // validate and cast updated object
              this._schema.validate(updatedObject);
              updatedObject = this._schema.cast(updatedObject);
              // add original key to object
              updatedObject._key = key;
              // update object
              // no need to pass key since it is already in the object
              // MDN: If the object store uses in-line keys and key is specified,
              // DataError is thrown.
              const updateRequest = objectStore.put(updatedObject);
              updateRequest.onsuccess = () => {
                resolve(new _document_js__WEBPACK_IMPORTED_MODULE_1__["default"](updatedObject, this, false));
              };
              updateRequest.onerror = () => {
                reject(updateRequest.error);
              };
            } else {
              reject(
                new Error(`No document found with query '${query?.toString()}'`)
              );
            }
          } else {
            reject(
              new Error(`No document found with query '${query?.toString()}'`)
            );
          }
        };
        request.onerror = (e) => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Updates all documents matching the query
   * @param {Object | IDBValidKey | IDBKeyRange | null} query - The query to match.
   * @param {Object} object
   * @returns {Promise<LeafstoreDocument<T>[]>}
   */
  async updateMany(query, object) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._db) throw new Error("Database is not connected");

        if (!object) throw new Error("update object is required");
        if (typeof object !== "object") {
          throw new Error("update object must be an object");
        }
        // Optimisation for primary key queries
        let objectStoreName = this._objectStoreName;
        let idbQuery = null;
        if (typeof query === "string") {
          idbQuery = query;
        }
        // optimisation ends
        const transaction = this._db.transaction(
          this._objectStoreName,
          "readwrite"
        );
        const objectStore = transaction.objectStore(this._objectStoreName);
        const request = objectStore.getAll(idbQuery);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            const documents = this.#parseQuery(query, result);
            // update documents
            documents.forEach((document) => {
              let updatedObject = {
                ...document,
                ...(object || {}),
              };
              // validate and cast updated object
              this._schema.validate(updatedObject);
              updatedObject = this._schema.cast(updatedObject);
              // add original key to object
              updatedObject._key = document._key;
              // update object
              // no need to pass key since it is already in the object
              // MDN: If the object store uses in-line keys and key is specified,
              // DataError is thrown.
              const updateRequest = objectStore.put(updatedObject);
              updateRequest.onsuccess = () => {
                resolve(
                  documents.map(
                    (object) => new _document_js__WEBPACK_IMPORTED_MODULE_1__["default"](object, this, false)
                  )
                );
              };
              updateRequest.onerror = () => {
                reject(updateRequest.error);
              };
            });
          } else {
            resolve([]);
          }
        };
        request.onerror = (e) => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Counts the number of documents matching the query
   * @param {Object | IDBValidKey | IDBKeyRange | null} [query] - The query to match.
   * @returns {Promise<Number>}
   */
  async count(query) {
    return new Promise((resolve, reject) => {
      try {
        if (!this._db) throw new Error("Database is not connected");

        // Optimisation for primary key queries
        let objectStoreName = this._objectStoreName;
        let idbQuery = null;
        if (typeof query === "string") {
          idbQuery = query;
        }
        // optimisation ends
        const transaction = this._db.transaction(objectStoreName, "readonly");
        const objectStore = transaction.objectStore(this._objectStoreName);
        const request = objectStore.getAll(idbQuery);
        request.onsuccess = (e) => {
          const result = request.result;
          if (result) {
            const documents = this.#parseQuery(query, result);
            resolve(documents.length);
          } else {
            resolve(0);
          }
        };
        request.onerror = (e) => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * filters documents by a query.
   * Also filters deleted documents
   * @param {Object} query - The query to match
   * @param {Object[]} documents - The documents to filter
   * @param {Boolean} [returnOne=false] - Whether to return on first match
   * @returns {Object[] | Object | null}
   */
  #parseQuery(query, documents, returnOne = false) {
    if (!query) return documents;

    documents = this.#filterDeleted(documents);

    /**
     * @type {[String, Function][]}
     */
    const supportedOperators = [
      ["$eq", (a, b) => a === b],
      ["$gt", (a, b) => a > b],
      ["$gte", (a, b) => a >= b],
      ["$lt", (a, b) => a < b],
      ["$lte", (a, b) => a <= b],
      ["$in", (a, b) => b.includes(a)],
      ["$nin", (a, b) => !b.includes(a)],
      ["$ne", (a, b) => a !== b],
      ["$regex", (a, b) => b.test(a)],
    ];

    const doesMatch = (document) => {
      for (let key in query) {
        if (query.hasOwnProperty(key)) {
          if (!document.hasOwnProperty(key)) return false;
          if (typeof query[key] === "object") {
            for (let op in query[key]) {
              if (query[key].hasOwnProperty(op)) {
                const [operatorName, operatorFunc] = supportedOperators.find(
                  (operator) => operator[0] === op
                ) || [null, () => false];
                if (!operatorName) {
                  throw new Error(`Operator '${op}' is not supported`);
                }
                if (!operatorFunc(document[key], query[key][op])) {
                  return false;
                }
              } else {
                return false;
              }
            }
          } else {
            if (document[key] !== query[key]) return false;
          }
        }
      }
      return true;
    };

    if (returnOne) {
      return documents.find(doesMatch);
    }
    return documents.filter(doesMatch);
  }

  /**
   * Adds a unique key to an object
   * @param {Object} object
   * @returns {void}
   */
  #addUniqueKey(object) {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000000);
    let key = `${timestamp}${random}`;
    object["_key"] = key;
  }

  /**
   * Adds meta data to an object
   * @param {Object} object
   * @returns {void}
   */
  #addMetaData(object) {
    // TODO: add meta data as per need
    // currently not in use
  }

  /**
   * Deletes multiple documents by their primary keys from the database.
   * Non blocking. Uses a cache to store deleted keys.
   * @param {String[]} keys
   */
  #deleteByKeys(keys) {
    if (!keys) return;
    try {
      keys.forEach((key) => {
        // timeout to make it non blocking
        setTimeout(() => {
          this.#deleteByKey(key);
        }, 0);
      });
    } catch (error) {
      // do nothing
    }
  }

  /**
   * Deletes a document by its primary key from the database.
   * Non blocking. Uses a cache to store deleted keys.
   * @param {String} key
   */
  #deleteByKey(key) {
    if (!key) return;
    try {
      if (!this._db) throw new Error("Database is not connected");

      const transaction = this._db.transaction(
        this._objectStoreName,
        "readwrite"
      );
      const objectStore = transaction.objectStore(this._objectStoreName);
      const request = objectStore.delete(key);
      request.onsuccess = (e) => {
        // remove key from cache
        this._deletedKeys = this._deletedKeys.filter((k) => k !== key);
      };
      request.onerror = (e) => {
        // do nothing
      };
    } catch (error) {
      // do nothing
    }
  }

  /**
   * Filters deleted documents from a list of documents.
   * @param {Object[]} documents
   * @returns {Object[]}
   */
  #filterDeleted(documents) {
    return documents.filter((document) => {
      return !this._deletedKeys.includes(document?._key);
    });
  }
}

// module.exports = LeafstoreModel;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (LeafstoreModel);


/***/ }),

/***/ "./node_modules/leafstore-db/src/schema.js":
/*!*************************************************!*\
  !*** ./node_modules/leafstore-db/src/schema.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * @typedef {Object} LeafstoreSchemaOptions
 */

/**
 * @template {Record<string, any>} T
 * @class
 */
class LeafstoreSchema {
  /**
   * Creates a Leafstore schema. This should not be called directly. Use {@link leafstore.Schema} instead.
   * @param {T} object - The template object used to generate the schema.
   * @param {LeafstoreSchemaOptions} options - Optional configuration for the schema.
   */
  constructor(object, options = {}) {
    this._rawSchema = object;
    this._schema = this.#generateSchema(object);
  }

  /**
   * Generates a schema from the given template object.
   * @param {Object} object - The template object used to generate the schema.
   * @param {string | undefined} [name] - The name of the object.
   * @returns {Object} The generated schema.
   */
  #generateSchema(object, name) {
    // TODO: check logic again
    let schema = {};
    // add key to schema if root object
    if (!name) {
      schema = {
        _key: {
          _type: "string",
          _validators: [],
        },
      };
    }
    for (let key in object) {
      if (key === "type") {
        const validators = this.#validators(object, name);
        const isUnique = object.unique;
        schema = {
          _type: object[key],
          _validators: validators,
          _unique: isUnique,
        };
      } else if (object.hasOwnProperty(key)) {
        const fieldProps = object[key];
        if (typeof fieldProps === "string") {
          schema[key] = {
            _type: fieldProps,
            _validators: [],
          };
        } else if (Array.isArray(fieldProps)) {
          schema[key] = {
            _type: "array",
            _schema: this.#generateSchema(fieldProps[0], key),
          };
        } else if (typeof fieldProps === "object") {
          schema[key] = this.#generateSchema(fieldProps, key);
        }
      }
    }
    return schema;
  }

  /**
   * Generates validators for a field.
   * @param {Object} fieldProps - The properties of the field.
   * @param {string} [name] - The name of the field.
   * @returns {Array<Function>} An array of validators.
   */
  #validators(fieldProps, name) {
    const { required, minLength, maxLength, minValue, maxValue } = fieldProps;

    const validators = [];

    const requiredValidator = (value) => {
      if (required && !value) throw new Error(`${name} is required`);
    };

    const minLengthValidator = (value) => {
      // validator format
      // minLength: 4 OR minLength: [4, "error message"]
      let message;
      if (Array.isArray(minLength)) {
        let [length, _message] = minLength;
        message = _message;
        if (typeof length !== "number")
          throw new Error(`Invalid minLength value for ${name}`);
        if (typeof message !== "string")
          message = `length of ${name} must be at least ${length}`;
      } else {
        if (typeof minLength !== "number")
          throw new Error(`Invalid minLength value for ${name}`);
        message = `length of ${name} must be at least ${minLength}`;
      }
      if (value?.length < minLength) throw new Error(message);
      return true;
    };

    const maxLengthValidator = (value) => {
      // validator format
      // maxLength: 4 OR maxLength: [4, "error message"]
      let message;
      if (Array.isArray(maxLength)) {
        let [length, _message] = maxLength;
        message = _message;
        if (typeof length !== "number")
          throw new Error(`Invalid maxLength value for ${name}`);
        if (typeof message !== "string")
          message = `Length of ${name} must be at most ${length}`;
      } else {
        if (typeof maxLength !== "number")
          throw new Error(`Invalid maxLength value for ${name}`);
        message = `Length of ${name} must be at most ${maxLength}`;
      }
      if (value?.length > maxLength) throw new Error(message);
      return true;
    };

    const minValueValidator = (value) => {
      // validator format
      // minValue: 4 OR minValue: [4, "error message"]
      let message;
      if (Array.isArray(minValue)) {
        let [value, _message] = minValue;
        message = _message;
        if (typeof value !== "number")
          throw new Error(`Invalid minValue value for ${name}`);
        if (typeof message !== "string")
          message = `${name} must be at least ${value}`;
      } else {
        if (typeof minValue !== "number")
          throw new Error(`Invalid minValue value for ${name}`);
        message = `${name} must be at least ${minValue}`;
      }
      if (value < minValue) throw new Error(message);
      return true;
    };

    const maxValueValidator = (value) => {
      // validator format
      // maxValue: 4 OR maxValue: [4, "error message"]
      let message;
      if (Array.isArray(maxValue)) {
        let [value, _message] = maxValue;
        message = _message;
        if (typeof value !== "number")
          throw new Error(`Invalid maxValue value for ${name}`);
        if (typeof message !== "string")
          message = `${name} must be at most ${value}`;
      } else {
        if (typeof maxValue !== "number")
          throw new Error(`Invalid maxValue value for ${name}`);
        message = `${name} must be at most ${maxValue}`;
      }
      if (value > maxValue) throw new Error(message);
      return true;
    };

    // add validators to array
    if (required) validators.push(requiredValidator);
    if (minLength && typeof minLength === "number")
      validators.push(minLengthValidator);
    if (maxLength && typeof maxLength === "number")
      validators.push(maxLengthValidator);
    if (minValue && typeof minValue === "number")
      validators.push(minValueValidator);
    if (maxValue && typeof maxValue === "number")
      validators.push(maxValueValidator);

    return validators;
  }

  /**
   * Validates an object against the schema.
   * @param {Object} object - The object to validate.
   * @returns {void}
   * @throws {Error} Throws an error if the object is invalid.
   */
  validate(object) {
    this.#validateObject(object, this._schema);
  }

  /**
   * Validates an object against the schema.
   * @param {Object} object - The object to validate.
   * @param {Object} schema - The schema to validate against.
   * @returns {void}
   * @throws {Error} Throws an error if the object is invalid.
   */
  #validateObject(object, schema) {
    // TODO: check logic again
    for (let key in schema) {
      if (schema.hasOwnProperty(key)) {
        const fieldProps = schema[key];
        if (fieldProps._type === "array") {
          if (!object[key]) object[key] = []; // default value for array
          if (Array.isArray(object[key])) {
            object[key].forEach((item) => {
              this.#validateObject(item, fieldProps._schema);
            });
          } else {
            throw new Error(`'${key}' must be an array`);
          }
        } else if (fieldProps._type === "object") {
          this.#validateObject(object[key], fieldProps);
        } else {
          fieldProps._validators?.forEach((validator) => {
            validator(object[key]);
          });
        }
      }
    }
  }

  /**
   * Casts an object to the schema.
   * @param {Object} object - The object to cast.
   * @returns {Object} The casted object.
   * @throws {Error} Throws an error if the object is invalid.
   */
  cast(object) {
    return this.#cast(object, this._schema);
  }

  /**
   * Casts an object to the schema.
   * @param {Object} object - The object to cast.
   * @param {Object} schema - The schema to cast against.
   * @returns {Object} The casted object.
   * @throws {Error} Throws an error if the object is invalid.
   */
  #cast(object, schema) {
    let result = {};
    for (let key in schema) {
      if (schema.hasOwnProperty(key)) {
        const fieldProps = schema[key];
        if (fieldProps._type === "array") {
          if (!object[key]) object[key] = []; // default value for array
          if (Array.isArray(object[key])) {
            result[key] = object[key].map((item) => {
              return this.#cast(item, fieldProps._schema);
            });
          } else {
            throw new Error(`'${key}' must be an array`);
          }
        } else if (fieldProps._type === "object") {
          result[key] = this.#cast(object[key], fieldProps);
        } else {
          result[key] = object[key];
        }
      }
    }
    return result;
  }
}

// module.exports = LeafstoreSchema;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (LeafstoreSchema);


/***/ }),

/***/ "./src/content.js":
/*!************************!*\
  !*** ./src/content.js ***!
  \************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var leafstore_db__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! leafstore-db */ "./node_modules/leafstore-db/index.js");
console.log("Extension loaded");

const fetchUrl = "http://127.0.0.1:3000";



const db = new leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"]("CSES_MARKER_EXTENSION_DB");

const problemSchema = leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].Schema({
  _id: {
    type: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
    required: false,
  },
  problemName: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
  problemId: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
  isImportant: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.Boolean,
  message: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
  user: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
  group: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
  username: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
});

const userSchema = leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].Schema({
  _id: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
  email: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
  username: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
  password: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
  sorting: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
  filter: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
  groupJoined: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
  questions: [
    {
      _id: {
        type: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
        required: false,
      },
      problemName: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
      problemId: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
      isImportant: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.Boolean,
      message: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
      user: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
      group: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
      username: leafstore_db__WEBPACK_IMPORTED_MODULE_0__["default"].SchemaTypes.String,
    },
  ],
});
const User = db.Model("User", userSchema);
const Problem = db.Model("Problem", problemSchema);

//   DIV1
// insert a div before content class div into the DOM
const div1 = document.createElement("div");
div1.id = "cses-marker-extension-root-1";
// div.style.display = "none";
const contentDiv = document.querySelector(".content");
contentDiv.insertBefore(div1, contentDiv.firstChild);
div1.innerHTML = `
<button id="cses-marker-click-to-login-button">Click to LogIn</button>
`;

//   DIV2
const div2 = document.createElement("div");
div2.id = "cses-marker-extension-root-2";
div2.style.display = "none";
const contentDiv2 = document.querySelector(".content");
contentDiv2.insertBefore(div2, contentDiv2.firstChild);
div2.innerHTML = `
username: <input id="username" type="text" /> password: <input id="password" type="password" /> <button id="cses-marker-login-button">LogIn</button>
`;

//   DIV3
const div3 = document.createElement("div");
div3.id = "cses-marker-extension-root-3";
div3.style.display = "none";
const contentDiv3 = document.querySelector(".content");
contentDiv2.insertBefore(div3, contentDiv3.firstChild);
div3.innerHTML = `
<button id="cses-marker-sync-button">Sync</button><button id="cses-marker-logout-button">LogOut</button>
`;

//                DIV OVER

//       ADDING MARK IMPORTANT BUTTON CHECKBOX BEFORE A TASK TAG
const TASK_LI_ELEMENT = document.querySelectorAll(".task");
TASK_LI_ELEMENT.forEach((taskElement) => {
  const checkboxDiv = document.createElement("div");
  checkboxDiv.className = "checkbox";
  const checkboxInput = document.createElement("input");
  checkboxInput.type = "checkbox";
  const anchorElement = taskElement.querySelector("a");
  if (anchorElement) {
    // Extract href attribute
    checkboxInput.className = "cses-marker-checkbox";
    const hrefAttribute = anchorElement.getAttribute("href");
    checkboxInput.dataset.problemId = hrefAttribute;
    checkboxInput.dataset.problemName =
      anchorElement.innerText || anchorElement.textContent;
  }
  checkboxDiv.appendChild(checkboxInput);
  taskElement.insertBefore(checkboxDiv, taskElement.firstChild);
});

const call2 = async () => {
  const count = await User.find({});
  const count2 = await Problem.find({});
  console.log(count);
  console.log(count2);
};
// Connect to the database
try {
  await db.connect({
    version: 1,
    onUpgrade: (db) => {
      console.log("Upgrading the database");
    },
  });
  console.log("Connected to the database");
  const users = await User.find({});
  if (users.length !== 0) {
    div1.style.display = "none";
    div3.style.display = "block";
    const problemsArray = await Problem.find({});
    problemsArray.forEach((problem) => {
      const checkbox = document.querySelector(
        `[data-problem-id="${problem.problemId}"]`
      );
      if (!checkbox) return;
      // make whole task div green
      const taskDiv = checkbox.parentElement.parentElement;
      const anchorElement =
        checkbox.parentElement.parentElement.querySelector("a");
      if (problem.isImportant) {
        taskDiv.style.backgroundColor = "lightyellow";
        anchorElement.style.fontWeight = "bold";
      } else {
        taskDiv.style.backgroundColor = "white";
      }
      // make checkbox checked
      if (checkbox && problem.user === users[0]._id && problem.isImportant) {
        checkbox.checked = problem.isImportant;
        // make anchor tag Red and bold
        if (anchorElement) {
          anchorElement.style.color = "red";
          anchorElement.style.fontWeight = "bold";
        }
      }
    });
    const navSlidebar = document.querySelector(".nav.sidebar");
    if (navSlidebar) {
      // creating a comment div at the top to add to the sidebar
      const commentDiv = document.createElement("div");
      commentDiv.className = "comment";
      commentDiv.innerHTML = `<textarea id="cses-marker-comment-input" type="text" placeholder="Add comment" style="height: 300px; display: block; width : 100%"/></textarea><button id="cses-marker-comment-button">Add</button>`;
      navSlidebar.insertBefore(commentDiv, navSlidebar.firstChild);
      // showing comments as a list
      //print url of the problem
      const url = window.location.href;
      const urlArray = url.split("/");
      const problemId =
        "/" +
        urlArray[urlArray.length - 3] +
        "/" +
        urlArray[urlArray.length - 2] +
        "/" +
        urlArray[urlArray.length - 1];
      const commentsList = document.createElement("div");
      commentsList.className = "comment";
      const comments = await Problem.find({
        problemId: problemId,
      });
      comments.forEach((comment) => {
        const commentElement = document.createElement("div");
        commentElement.innerHTML = `${comment.username} : ${comment.message}`;
        commentsList.appendChild(commentElement);
      });
      navSlidebar.insertBefore(commentsList, navSlidebar.firstChild);

      // adding event listener to comment button
      document
        .querySelector("#cses-marker-comment-button")
        .addEventListener("click", async () => {
          const users = await User.find({});
          if (users.length === 0) return;
          const user = users[0];
          const comment = document.querySelector(
            "#cses-marker-comment-input"
          ).value;
          // clear the input
          document.querySelector("#cses-marker-comment-input").value = "";
          if (comment === "") return;
          const url = window.location.href;
          const urlArray = url.split("/");
          const problemId =
            "/" +
            urlArray[urlArray.length - 3] +
            "/" +
            urlArray[urlArray.length - 2] +
            "/" +
            urlArray[urlArray.length - 1];
          const problems = await Problem.find({
            problemId: problemId,
            user: user._id,
          });
          const problemName = document
            .querySelector(".title-block")
            .getElementsByTagName("h1")[0].innerText;
          console.log(problemName);
          if (problems.length === 0) {
            const problem = {
              problemId: problemId,
              problemName: problemName,
              isImportant: false,
              message: comment,
              user: user._id,
              username: user.username,
            };
            if (user.groupJoined !== undefined && user.groupJoined !== "") {
              problem.group = user.groupJoined;
            }
            const newProblem = await Problem.create(problem);
            const commentElement = document.createElement("div");
            commentElement.innerHTML = `${problem.username} : ${problem.message}`;
            commentsList.insertBefore(commentElement, commentsList.firstChild);
            // adding problem to user
            user.questions = [...user.questions, problem];
            await user.save();
            return;
          }
          const problem = problems[0];
          problem.message = comment;
          await problem.save();
          const commentElement = document.createElement("div");
          commentElement.innerHTML = `${problem.problemName} : ${problem.message}`;
          commentsList.insertBefore(commentElement, commentsList.firstChild);
          // adding problem to user
          const questions = [];
          for (let i = 0; i < user.questions.length; i++) {
            if (user.questions[i].problemId === problemId) {
              user.questions[i].message = comment;
            }
            questions.push(user.questions[i]);
          }
          user.questions = questions;
          await user.save();
          // reload the page
          window.location.reload();
        });
    }
  }
} catch (error) {
  console.log("Error connecting to the INDEX DB database. Please try again.");
  await User.deleteAll();
  await Problem.deleteAll();
  call2();
  console.log(error);
}

//            EVENT LISTENERS

//      OPEN DILOGUE BOX TO LOGIN
document
  .querySelector("#cses-marker-click-to-login-button")
  .addEventListener("click", () => {
    div1.style.display = "none";
    div2.style.display = "block";
  });

//      MAKE LOGIN REQUEST AND SYNC BUTTON IS LOADED
document
  .querySelector("#cses-marker-login-button")
  .addEventListener("click", () => {
    const username = document.querySelector("#username").value;
    const password = document.querySelector("#password").value;
    if (username === "" || password === "") return;
    fetch(fetchUrl + "/userLogin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Include any other headers if needed
      },
      body: JSON.stringify({
        username: username,
        password: password,
        // Include other parameters in the request body as needed
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success === true) {
          div2.style.display = "none";
          div3.style.display = "block";
          data.problems.forEach((problem) => {
            Problem.create(problem);
          });
          User.create(data.user);
          // reload the page
          window.location.reload();
        }
      })
      .catch((error) => {
        // Handle errors
        console.error("Fetch error:", error);
      });
  });

//      SYNC BUTTON
document
  .querySelector("#cses-marker-sync-button")
  .addEventListener("click", () => {
    sync();
  });

const sync = async () => {
  const users = await User.find({});
  if (users.length === 0) return;
  const user = users[0]._object;
  fetch(fetchUrl + "/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Include any other headers if needed
    },
    body: JSON.stringify({
      user: user,
      // Include other parameters in the request body as needed
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(async (data) => {
      await User.deleteAll();
      await Problem.deleteAll();
      // Handle the response data
      data.problems.forEach((problem) => {
        Problem.create(problem);
      });
      User.create(data.user);
      // reload the page
      window.location.reload();
    })
    .catch((error) => {
      // Handle errors
      console.error("Fetch error:", error);
    });
};

document
  .querySelector("#cses-marker-logout-button")
  .addEventListener("click", async () => {
    await User.deleteAll();
    await Problem.deleteAll();
    window.location.reload();
  });

//    ADDING EVENT LISTENER TO CHECKBOXES
const checkboxes = document.querySelectorAll(".cses-marker-checkbox");
checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", async (event) => {
    const users = await User.find({});
    if (users.length === 0) return;
    const user = users[0];
    let flag = false;
    const checked = event.target.checked;
    const questions = [];
    for (let i = 0; i < user.questions.length; i++) {
      if (user.questions[i].problemId === event.target.dataset.problemId) {
        flag = true;
        user.questions[i].isImportant = checked;
        const ProblemInProblem = await Problem.findOne({
          problemId: event.target.dataset.problemId,
          user: user._id,
        });
        ProblemInProblem.isImportant = checked;
        await ProblemInProblem.save();
      }
      questions.push(user.questions[i]);
    }
    user.questions = questions;
    if (!flag) {
      const problem = {
        problemId: event.target.dataset.problemId,
        problemName: event.target.dataset.problemName,
        isImportant: checked,
        message: "",
        user: user._id,
        username: user.username,
      };
      if (user.groupJoined !== "") {
        problem.group = user.groupJoined;
      }
      const newProblem = await Problem.create(problem);
      user.questions = [...user.questions, problem];
    }
    await user.save();
  });
});

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } }, 1);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/async module */
/******/ 	(() => {
/******/ 		var webpackQueues = typeof Symbol === "function" ? Symbol("webpack queues") : "__webpack_queues__";
/******/ 		var webpackExports = typeof Symbol === "function" ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 		var webpackError = typeof Symbol === "function" ? Symbol("webpack error") : "__webpack_error__";
/******/ 		var resolveQueue = (queue) => {
/******/ 			if(queue && queue.d < 1) {
/******/ 				queue.d = 1;
/******/ 				queue.forEach((fn) => (fn.r--));
/******/ 				queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 			}
/******/ 		}
/******/ 		var wrapDeps = (deps) => (deps.map((dep) => {
/******/ 			if(dep !== null && typeof dep === "object") {
/******/ 				if(dep[webpackQueues]) return dep;
/******/ 				if(dep.then) {
/******/ 					var queue = [];
/******/ 					queue.d = 0;
/******/ 					dep.then((r) => {
/******/ 						obj[webpackExports] = r;
/******/ 						resolveQueue(queue);
/******/ 					}, (e) => {
/******/ 						obj[webpackError] = e;
/******/ 						resolveQueue(queue);
/******/ 					});
/******/ 					var obj = {};
/******/ 					obj[webpackQueues] = (fn) => (fn(queue));
/******/ 					return obj;
/******/ 				}
/******/ 			}
/******/ 			var ret = {};
/******/ 			ret[webpackQueues] = x => {};
/******/ 			ret[webpackExports] = dep;
/******/ 			return ret;
/******/ 		}));
/******/ 		__webpack_require__.a = (module, body, hasAwait) => {
/******/ 			var queue;
/******/ 			hasAwait && ((queue = []).d = -1);
/******/ 			var depQueues = new Set();
/******/ 			var exports = module.exports;
/******/ 			var currentDeps;
/******/ 			var outerResolve;
/******/ 			var reject;
/******/ 			var promise = new Promise((resolve, rej) => {
/******/ 				reject = rej;
/******/ 				outerResolve = resolve;
/******/ 			});
/******/ 			promise[webpackExports] = exports;
/******/ 			promise[webpackQueues] = (fn) => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
/******/ 			module.exports = promise;
/******/ 			body((deps) => {
/******/ 				currentDeps = wrapDeps(deps);
/******/ 				var fn;
/******/ 				var getResult = () => (currentDeps.map((d) => {
/******/ 					if(d[webpackError]) throw d[webpackError];
/******/ 					return d[webpackExports];
/******/ 				}))
/******/ 				var promise = new Promise((resolve) => {
/******/ 					fn = () => (resolve(getResult));
/******/ 					fn.r = 0;
/******/ 					var fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
/******/ 					currentDeps.map((dep) => (dep[webpackQueues](fnQueue)));
/******/ 				});
/******/ 				return fn.r ? promise : getResult();
/******/ 			}, (err) => ((err ? reject(promise[webpackError] = err) : outerResolve(exports)), resolveQueue(queue)));
/******/ 			queue && queue.d < 0 && (queue.d = 0);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module used 'module' so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/content.js");
/******/ 	
/******/ })()
;
//# sourceMappingURL=content.js.map