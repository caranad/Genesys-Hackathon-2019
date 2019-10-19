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
                    vm.sendImage(input);
                }
                reader.readAsDataURL(input);
            }
        },
        sendImage: function(image) {
            var vm = this;
            event.preventDefault();
            vm.submit = true;

            console.log(event);

            navigator.geolocation.getCurrentPosition((position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&APPID=277b013a4573cd9ac323b78d7dc15971`).then((response) => {
                    var formData = new FormData();
                    formData.append("latitude", latitude);
                    formData.append("longitude", longitude);
                    vm.loaded = 33;
                    formData.append("country", response.data.sys.country);
                    vm.loaded = 66;
                    formData.append("weather", response.data.weather[0].description);
                    formData.append("userfile", image);
                    vm.loaded = 100;

                    axios({
                        method: 'post',
                        url: 'https://localhost:3000/upload',
                        data: formData,
                        config: { headers: {'Content-Type': 'multipart/form-data' }}
                    })
                    .then(function (response) {
                        console.log(response);
                    })
                    .catch(function (response) {
                        console.log(response);
                    });
                })
            });
        }
    }
})