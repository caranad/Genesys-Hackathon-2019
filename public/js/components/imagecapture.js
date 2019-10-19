var app = new Vue({
    el: "#app", 
    data: {
        image: '#',
        submit: false,
        loaded: 0
    },
    mounted: () => {
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', (e) => this.getFileInfo(e.target.files));
    },
    methods: {
        getFileInfo: (input) => {
            if (input) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.image = e.target.result;
                    document.querySelector("#selectedImage").src = this.image;
                }
                reader.readAsDataURL(input[0]);
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