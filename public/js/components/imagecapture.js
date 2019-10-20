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
        loadImage : function(e) {
            var vm = this;
            EXIF.getData(e.target, function() {
                switch(EXIF.getTag(e.target, "Orientation")) {
                    case 3:
                        vm.$refs.selectedImage.style.transform = "rotate(180deg)"; break;
                    case 6:
                        vm.$refs.selectedImage.style.transform = "rotate(90deg)"; break;
                    case 8:
                        vm.$refs.selectedImage.style.transform = "rotate(270deg)"; break;
                    case 1:
                        vm.$refs.selectedImage.style.transform = "rotate(0deg)"; break;
                }
            });
        },
        getFileInfo: function (input) {
            var vm = this;
            if (input) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    var src = e.target.result;
                    vm.image = src;
                    vm.loaded = 33;
                    vm.sendImage(input);
                }
                reader.readAsDataURL(input);
            }
        },
        sendImage: function(image) {
            var vm = this;
            event.preventDefault();
            vm.submit = true;

            navigator.geolocation.getCurrentPosition((position) => {
                //alert(position);
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                vm.loaded = 66;

                axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&APPID=277b013a4573cd9ac323b78d7dc15971`).then((response) => {
                    vm.loaded = 90;    
                
                    var formData = new FormData();
                    formData.append("latitude", latitude);
                    formData.append("longitude", longitude);
                    formData.append("country", response.data.sys.country);
                    formData.append("weather", response.data.weather[0].description);
                    formData.append("userfile", image);
                    
                    
                    axios({
                        method: 'post',
                        url: '/upload',
                        data: formData,
                        config: { headers: {'Content-Type': 'multipart/form-data' }}
                    })
                    .then(function (response) {
                        console.log(response);
                        //alert("Success");
                        vm.loaded = 100;
                    })
                    .catch(function (response) {
                        //alert(response);
                        console.log(response);
                        //alert("Fail");
                        vm.loaded = 100;
                    });
                })
            });
        }
    }
})