var app = new Vue({
    el: "#app", 
    data: {
        lat : '',
        long : '',
        country : '',
        city : '',
        weather : '',
        extreme_weather : '',
        temperature : '',
        color : '',
        tags : '',
        suggestion : '',
        confidence : ''
    },
    mounted : async function() {
        const response = await fetch("uploads/data.json");
        const data = await response.json();

        this.lat = data.env_data.lat;
        this.long = data.env_data.long;
        this.country = data.env_data.country;
        this.city = data.env_data.city;
        this.weather = data.env_data.weather;
        this.extreme_weather = data.env_data.extreme_weather;
        this.temperature = data.env_data.temperature;
        this.color = data.env_data.img_data.color;
        this.tags = data.env_data.img_data.tags;
        this.suggestion = data.suggestion;
        this.confidence = data.confidence;
    },
    methods: {
        
    }
});