/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("y6fyrzm8wm2lhln");

  return dao.deleteCollection(collection);
}, (db) => {
  const collection = new Collection({
    "id": "y6fyrzm8wm2lhln",
    "created": "2024-10-22 20:03:21.018Z",
    "updated": "2024-10-22 20:03:21.018Z",
    "name": "position",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "p67xbavq",
        "name": "name",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
})
