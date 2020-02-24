window.onload = function () {
    $(':text').bind('input', inputHelper.checkConfig);
    $(".config > form").bind('submit', (e) => {
        e.preventDefault();
        let username = $("input[name='username']")[0].value;
        let password = $("input[name='password']")[0].value;
        let subscriptionId = $("input[name='subscriptionId']")[0].value;
        app.init(username, password, subscriptionId);
    });

    $("input[name='id-front']").bind('change', (e) => {
        let file = e.target.files[0]
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e1) => {
            $("img[name='id-front']")[0].src = e1.target.result;
            $("button[name='upload-front-image']")[0].disabled = false;
        };
    });

    $("form.app__screen-1").bind('submit', (e) => {
        e.preventDefault();
        app.uploadFrontImage($("img[name='id-front']")[0].src);
    });


    // Init user creds if they already exist

    let configJSONString = sessionStorage.getItem('config');
    if (configJSONString) {
        let config = JSON.parse(configJSONString);
        APP_CONFIG = {
            ...APP_CONFIG,
            ...config
        };
        $("input[name='username']")[0].value = config.username;
        $("input[name='password']")[0].value = config.password;
        $("input[name='subscriptionId']")[0].value = config.subscriptionId;
        $("button[name='init']")[0].disabled = false;
    }
}

var inputHelper = {
    checkConfig: function (e) {
        let usernameInput = $("input[name='username']")[0];
        let passwordInput = $("input[name='password']")[0];
        let subscriptionIdInput = $("input[name='subscriptionId']")[0];

        if (usernameInput.value && passwordInput.value && subscriptionIdInput.value) {
            $("button[name='init']")[0].disabled = false;
        } else {
            $("button[name='init']")[0].disabled = true;
        }
    },
    dataURLToBlob(canvasDataURL) {
        let binary = atob(canvasDataURL.split(',')[1]);
        let array = [];
        for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], { type: 'image/jpg' });
    }
}

var APP_CONFIG = {
    baseURL: "https://services.assureid.net",
    instanceId: "",
    username: "",
    password: "",
    subscriptionId: ""
};

var app = {
    init: function (username, password, subscriptionId) {
        $.ajax({
            url: APP_CONFIG.baseURL + '/AssureIDService/Document/Instance',
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify({
                "AuthenticationSensitivity": 0,
                "ClassificationMode": 0,
                "Device": {
                    "HasContactlessChipReader": false,
                    "HasMagneticStripeReader": false,
                    "SerialNumber": "JavaScriptWebSDK 11.0.0",
                    "Type": {
                        "Manufacturer": "xxx",
                        "Model": "xxx",
                        "SensorType": 3
                    }
                },
                "ImageCroppingExpectedSize": 0,
                "ImageCroppingMode": 0,
                "ManualDocumentType": null,
                "ProcessMode": 0,
                "SubscriptionId": subscriptionId
            }),
            headers: {
                "Authorization": btoa(username + ":" + password),
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            success: function (result) {
                sessionStorage.setItem('config', JSON.stringify({
                    username,
                    password,
                    subscriptionId
                }));
                APP_CONFIG.instanceId = result;
                $("button[name='init']")[0].disabled = true;
                Swal.fire({
                    title: 'Initiated new instance',
                    text: result,
                    icon: 'success'
                });
            },
            error: function (err) {
                Swal.fire({
                    title: 'Error',
                    text: err.status + " - " + err.statusText,
                    icon: 'error'
                });
            }
        });
    },
    uploadFrontImage: function (imageData) {
        const data = inputHelper.dataURLToBlob(imageData)
        $.ajax({
            url: APP_CONFIG.baseURL + '/AssureIDService/Document/' + APP_CONFIG.instanceId + '/Image?side=0&light=0&metrics=true',
            type: 'POST',
            data: data,
            processData: false,
            headers: {
                "Authorization": btoa(APP_CONFIG.username + ":" + APP_CONFIG.password),
                "Accept": "application/json, text/plain, */*",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            success: function (result) {
                Swal.fire({
                    title: 'Image uploaded!',
                    icon: 'success'
                });
            },
            error: function (err) {
                Swal.fire({
                    title: 'Error',
                    text: err.status + " - " + err.statusText,
                    icon: 'error'
                });
            }
        });
    },
    getClassification: function () {
        $.ajax({
            url: APP_CONFIG.baseURL + '/AssureIDService/Document/' + APP_CONFIG.instanceId + '/Classification',
            type: 'GET',
            dataType: 'json',
            headers: {
                "Authorization": btoa(APP_CONFIG.username + ":" + APP_CONFIG.password),
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            success: function (result) {
                console.log('result ', result);
                Swal.fire({
                    title: 'Fetched classification!',
                    icon: 'success'
                });
            },
            error: function (err) {
                Swal.fire({
                    title: 'Error',
                    text: err.status + " - " + err.statusText,
                    icon: 'error'
                });
            }
        });
    }
}