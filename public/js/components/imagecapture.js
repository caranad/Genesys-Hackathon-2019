var app = new Vue({
    el: "#app", 
    data: {
        image: '#',
        loaded: 0,
        show: false
    },
    methods: {
        onImageSelect : function(e) {
            this.getFileInfo(e.target.files[0]);
        },
        loadImage : function(e) {
            /*
            var vm = this;
            EXIF.getData(e.target, function() {
                const ORIENT_TRANSFORMS = {
                    1: '',
                    2: 'rotateY(180deg)',
                    3: 'rotate(180deg)',
                    4: 'rotate(180deg) rotateY(180deg)',
                    5: 'rotate(270deg) rotateY(180deg)',
                    6: 'rotate(90deg)',
                    7: 'rotate(90deg) rotateY(180deg)',
                    8: 'rotate(270deg)'
                };
                var o = EXIF.getTag(e.target, "Orientation");
                var sty = ORIENT_TRANSFORMS[o];
                vm.$refs.selectedImage.style.transform = sty;
            });
            */
        },
        getFileInfo: function (input) {
            var vm = this;
            this.loaded = 0;
            if (input) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    //var src = e.target.result;
                    //vm.image = src;
                    vm.loaded = 33;
                    vm.sendImage(input);
                }
                reader.readAsDataURL(input);
            }
        },
        sendImage: function(image) {
            var vm = this;
            event.preventDefault();

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
                    formData.append("temperature", parseInt(response.data.main.temp) - 273);
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
                        vm.show = true;
                        vm.image = "uploads/image.jpg?ts=" + (new Date()).valueOf();
                        vm.triggerOverlay();
                        vm.loaded = 100;
                    })
                    .catch(function (response) {
                        alert(response);
                        vm.loaded = 100;
                    });
                })
            });
        },
        triggerOverlay: function() {
            setTimeout(() => {
                this.show = false;
            }, 2000)
        }
    }
})