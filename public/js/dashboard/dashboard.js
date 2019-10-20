var app = new Vue({
    el: "#app", 
    data: {
        lat : 'A',
        long : 'B',
        country : 'C',
        weather : 'D',
        temperature : 'E',
        problem : 'F'
    },
    mounted : async function() {
        const response = await fetch("uploads/data.json");
        const data = await response.json();

        this.lat = data.lat;
        this.long = data.long;
        this.country = data.country;
        this.weather = data.weather;
        this.temperature = data.temperature;
        this.problem = data.problem;
    },
    methods: {
        
    }
});