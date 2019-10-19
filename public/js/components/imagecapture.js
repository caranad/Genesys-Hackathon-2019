var app = new Vue({
    el: "#app", 
    data: {
        image: '#',
        submit: false,
        loaded: 0
    },
    methods: {
        onImageSelect : function(e) {
            this.getFileInfo(e.target.files[0]);
        },
        getFileInfo: function (input) {
            var vm = this;
            if (input) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    var src = e.target.result;
                    vm.image = src;
                }
                reader.readAsDataURL(input);
            }
        },
        sendImage: (event) => {
            event.preventDefault();
            this.submit = true;
            alert("Sending to backend");

            navigator.geolocation.getCurrentPosition((position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                axios.get(`
            http://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&APPID=277b013a4573cd9ac323b78d7dc15971
                `).then((response) => {
                    console.log(response);
                })
            });
        }
    }
})