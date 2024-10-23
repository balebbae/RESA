/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "2w938b48egyp0t3",
    "created": "2024-10-22 20:02:29.934Z",
    "updated": "2024-10-22 20:02:29.934Z",
    "name": "shift",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "lst12w5e",
        "name": "start",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "iguhejc9",
        "name": "end",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
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
  const collection = dao.findCollectionByNameOrId("2w938b48egyp0t3");

  return dao.deleteCollection(collection);
})
