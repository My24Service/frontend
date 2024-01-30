export default {
  data: {
    "num_existing": 1,
    "num_insert": 128,
    "updates": {
      "Liander N.V.": {
        "import_rec": {
          "Naam (klant)": "Bla B.V.",
          "Klant ID": 25,
          "Postcode": "1234 AA",
          "Straat (klant)": "Utrechtseweg 6",
          "Woonplaats": "Amsterdam",
          "Contact": "Hen-zen",
          "Land (klant)": "NL",
          "Mobiel": ""
        },
        "num_entries": 1,
        "entries": [
          {
            "id": 1185,
            "name": "Bla B.V.",
            "address": "Utrechtseweg 6",
            "postal": "1234 AA",
            "city": "Amsterdam",
            "country_code": "NL",
            "tel": "",
            "email": "",
            "contact": "",
            "mobile": "",
            "remarks": "",
            "customer_id": "2211",
          }
        ],
        "seen": 1
      }
    },
    "errors": [
      {
        "import_rec": {
          "Naam (klant)": "Klant onbekend",
          "Klant ID": 97,
          "Postcode": "",
          "Straat (klant)": "",
          "Woonplaats": "",
          "Contact": "",
          "Land (klant)": "NL",
          "E-mail": "",
          "Telefoon": "",
          "Mobiel": ""
        },
        "error_fields": [
          "Straat (klant)",
          "Postcode",
          "Woonplaats"
        ]
      }
    ],
    "insert_errors": []
  }
}
