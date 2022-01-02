export default {
	data: {
        "id": 3,
        "statuscode": "Aangemaakt",
        "color": "#ff3300",
        "description": "opdracht aangemaakt",
        "actions": [
            {
                "id": 2,
                "name": "planning kerstmarktspecialist",
                "address": "info@kerstmarktspecialist.nl,richard@pedroja.tech",
                "subject": "Kerstmarkt; {{ order_name }}, {{ order_address }}, {{ order_city }}",
                "description": "",
                "template": "Beste planning,\n\nDit zijn de verkopen van de markt ingevoerd voor {{ order_name }}, {{ order_address }}, {{ order_city }}.\n\nHet gaat om:\n\n{% for orderline in orderlines %}\n* product: {{ orderline.product }}\n  locatie: {{ orderline.location }}\n  opmerking: {{ orderline.remarks }}\n\n{% endfor %}\n\nLocatie:{{ location }}\nContactpersoon: {{ order_contact }}\nTel.: {{ order_tel }}\nDatum: {{ order_date }}\nBijzonderheden klant:{{ customer_remarks }}",
                "type": "email",
                "company_partner": null,
                "json_conditions": [],
                "querymode": "or",
                "statuscode": 3,
                "destination": "info@kerstmarktspecialist.nl,richard@pedroja.tech",
                "conditions": ""
            }
        ],
        "is_regex": true,
        "start_trip": false,
        "end_trip": false,
        "new_status_template": "opdracht aangemaakt door {{ username }}"
    }
}
