/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "9ww9tmo2i4q2pn7",
    "created": "2024-10-22 20:23:47.074Z",
    "updated": "2024-10-22 20:23:47.074Z",
    "name": "test_data",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "etvqbeqg",
        "name": "test",
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
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("9ww9tmo2i4q2pn7");

  return dao.deleteCollection(collection);
})
