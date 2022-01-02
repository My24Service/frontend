export default {
	data: {
	    "id": 1,
	    "name": "planning kerstmarktspecialist",
	    "address": "info@test.nl,test@test.tech",
	    "subject": "Kerstmarkt; {{ order_name }}, {{ order_address }}, {{ order_city }}",
	    "description": "",
	    "template": "Beste planning,\n\nDit zijn de verkopen van de markt ingevoerd voor {{ order_name }}, {{ order_address }}, {{ order_city }}.\n\nHet gaat om:\n\n{% for orderline in orderlines %}\n* product: {{ orderline.product }}\n  locatie: {{ orderline.location }}\n  opmerking: {{ orderline.remarks }}\n\n{% endfor %}\n\nLocatie:{{ location }}\nContactpersoon: {{ order_contact }}\nTel.: {{ order_tel }}\nDatum: {{ order_date }}\nBijzonderheden klant:{{ customer_remarks }}",
	    "type": "email",
	    "company_partner": null,
	    "json_conditions": [],
	    "querymode": "or",
	    "statuscode": 3,
	    "destination": "info@test.nl,test@test.tech",
	    "conditions": ""
	}
}
