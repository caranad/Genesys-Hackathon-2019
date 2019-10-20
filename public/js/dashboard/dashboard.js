var app = new Vue({
    el: "#app", 
    data: {
        lat : 'A',
        long : 'B',
        country : 'C',
        weather : 'D',
        problem : 'E'
    },
    mounted : async function() {
        const response = await fetch("uploads/data.json");
        const data = await response.json();

        this.lat = data.lat;
        this.long = data.long;
        this.country = data.country;
        this.weather = data.weather;
        this.problem = data.problem;
    },
    methods: {
        
    }
});