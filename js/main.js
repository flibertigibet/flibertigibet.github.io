window.onload = function () {
    $(':text').bind('input', inputHelper.checkConfig);
    $(".config > form").bind('submit', (e) => {
        e.preventDefault();
        let username = $("input[name='username']")[0].value;
        let password = $("input[name='password']")[0].value;
        let subscriptionId = $("input[name='subscriptionId']")[0].value;
        app.init(username, password, subscriptionId);
    });

    // $("input[name='id-front']").bind('change', (e) => {
    //     let file = e.target.files[0]
    //     let reader = new FileReader();
    //     reader.readAsDataURL(file);
    //     reader.onload = (e1) => {
    //         $("img[name='id-front']")[0].src = e1.target.result;
    //         $("button[name='upload-front-image']")[0].disabled = false;
    //     };
    // });

    $("button[name='start-camera']").bind('click', (e) => {
        e.preventDefault();
        toggleLoader(true);
        window.AcuantCameraUI.start((response) => {
            toggleLoader(false);
            $("img[name='id-front']")[0].src = response.image.data;
            $("button[name='upload-front-image']")[0].disabled = false;
            window.AcuantCameraUI.end();
            }, (error) => {
                toggleLoader(false);
                console.log("error occured", error);
                window.AcuantCameraUI.end();
        });
    });

    $("button[name='selfie-camera']").bind('click', (e) => {
        e.preventDefault();
        // window.AcuantCameraUI.start((response) => {
            // $("img[name='selfie-image']")[0].src = response.image.data;
            // $("button[name='verify-selfie-image']")[0].disabled = false;
        //     window.AcuantCameraUI.end();
        //     }, (error) => {
        //         console.log("error occured", error);
        //         window.AcuantCameraUI.end();
        // });
        toggleLoader(true);
        window.AcuantPassiveLiveness.startSelfieCapture(inputHelper.onCaptured);
    });

    $("button[name='upload-front-image']").bind('click', (e) => {
        e.preventDefault();
        app.uploadFrontImage($("img[name='id-front']")[0].src);
    });

    $("button[name='verify-selfie-image']").bind('click', (e) => {
        e.preventDefault();
        app.faceMatch($("img[name='selfie-image']")[0].src);
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
    initializeAcuantSDK: function () {
        window.AcuantJavascriptWebSdk.initialize(
            (function() {
                return btoa(`${APP_CONFIG.username}:${APP_CONFIG.password}`);
            })(), 
            APP_CONFIG.baseURL,
            {
                onSuccess:function(){
                    this.isInitialized = true;
                    this.isIntializing = false;
                }.bind(this),
    
                onFail: function(){
                    this.isIntializing = false;
                }.bind(this)
            });
    },
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
    },
    onCaptured(image) {
        toggleLoader(false);
        selfieData = image;
        $("img[name='selfie-image']")[0].src = 'data:image/jpeg;base64,' + image;
        $("button[name='verify-selfie-image']")[0].disabled = false;
    }
}

var toggleLoader = function (flag) {
    if (flag) {
        $('.loading').addClass('active');
    } else {
        $('.loading').removeClass('active');
    }
}

var APP_CONFIG = {
    baseURL: "https://services.assureid.net",
    faceMatchURL: "https://frm.acuant.net",
    instanceId: "",
    username: "",
    password: "",
    subscriptionId: ""
};

var resultData = {};
var processedData = {};
var finalData = {};
var selfieData = "";

var app = {
    init: function (username, password, subscriptionId) {
        toggleLoader(true);
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
                toggleLoader(false);
                sessionStorage.setItem('config', JSON.stringify({
                    username,
                    password,
                    subscriptionId
                }));
                APP_CONFIG.username = username;
                APP_CONFIG.password = password;
                APP_CONFIG.subscriptionId = subscriptionId;
                APP_CONFIG.instanceId = result;

                inputHelper.initializeAcuantSDK();
                $('.app').removeClass('hidden');
                $("button[name='init']")[0].disabled = true;
                Swal.fire({
                    title: 'Initiated new instance',
                    text: result,
                    icon: 'success'
                });
            },
            error: function (err) {
                toggleLoader(false);
                Swal.fire({
                    title: 'Error',
                    text: err.status + " - " + err.statusText,
                    icon: 'error'
                });
            }
        });
    },
    uploadFrontImage: function (imageData) {
        const data = inputHelper.dataURLToBlob(imageData);
        toggleLoader(true);
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
                toggleLoader(false);
                app.getClassification();
                // Swal.fire({
                //     title: 'Image uploaded!',
                //     icon: 'success'
                // });
            },
            error: function (err) {
                toggleLoader(false);
                Swal.fire({
                    title: 'Error',
                    text: err.status + " - " + err.statusText,
                    icon: 'error'
                });
            }
        });
    },
    getClassification: function () {
        toggleLoader(true);
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
                toggleLoader(false);
                processedData = result;
                if (result.Type && result.Type.ClassName === 'Unknown') {
                    Swal.fire({
                        title: 'Error',
                        text: "Could not identify image",
                        icon: 'error'
                    });
                } else {
                    // this.processClassification(result);
                    // Swal.fire({
                    //     title: 'Success!',
                    //     text: "Identified ID",
                    //     icon: 'success'
                    // });
                    app.getResultsData();
                }
            },
            error: function (err) {
                toggleLoader(false);
                Swal.fire({
                    title: 'Error',
                    text: err.status + " - " + err.statusText,
                    icon: 'error'
                });
            }
        });
    },
    getResultsData: function () {
        toggleLoader(true);
        $.ajax({
            url: APP_CONFIG.baseURL + '/AssureIDService/Document/' + APP_CONFIG.instanceId,
            type: 'GET',
            dataType: 'json',
            headers: {
                "Authorization": btoa(APP_CONFIG.username + ":" + APP_CONFIG.password),
            },
            success: function (result) {
                toggleLoader(false);
                console.log('result: ', result);
                resultData = result;
                app.processID();
                Swal.fire({
                    title: 'Successfully uploaded document!',
                    icon: 'success'
                });
                $("button[name='upload-front-image']")[0].disabled = true;
                $("button[name='start-camera']")[0].disabled = true;
                $('.selfie-group').removeClass('hidden');
            },
            error: function (err) {
                toggleLoader(false);
                Swal.fire({
                    title: 'Error',
                    text: err.status + " - " + err.statusText,
                    icon: 'error'
                });
            }
        });
    },
    getFaceImage: function (callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', APP_CONFIG.baseURL + '/AssureIDService/Document/' + APP_CONFIG.instanceId + '/Field/Image?key=Photo', true);
        xhr.responseType = 'arraybuffer';
        xhr.setRequestHeader('Authorization', btoa(APP_CONFIG.username + ":" + APP_CONFIG.password))
        // Here is the hack
        xhr.overrideMimeType('text/plain; charset=x-user-defined');

        xhr.onreadystatechange = function(event) {
            toggleLoader(false);
            callback(event.target.response);
        };
        toggleLoader(true);
        xhr.send();
    },
    processID: function() {
        var documentObj = resultData;
        var base64FaceReformattedImage = null;
        var base64SignatureReformattedImage = null;
        let dataObject = {};
        if (documentObj.Fields.length > 0) {

            /**
             * Pass processed data to our data object
             */

            documentObj.Fields.map(field => {
                dataObject[field.Name] = field.Value;
            });

            let type = resultData.Result;
            let idAuthentication = null;

            switch (type) {
                case 0 :
                    idAuthentication = 'Unknown';
                    break;
                case 1:
                    idAuthentication = 'Passed';
                    break;
                case 2:
                    idAuthentication = 'Failed';
                    break;
                case 3:
                    idAuthentication = 'Skipped';
                    break;
                case 4:
                    idAuthentication = 'Caution';
                    break;
                case 5:
                    idAuthentication = 'Attention';
                    break;
                default:
                    idAuthentication = 'Unknown';
                    break;
            }

            dataObject['Authentication'] = idAuthentication;

            /**
             * Get face image from Acuant Service
             * Get signature image from Acuant Service
             * Initialize Photo & Signature with empty strings otherwise it will try to access the photo on the
             * Acuant servers
             *
             * We need async / await if in case something happens with the Photo / Signature. We'll want to
             * show the results no matter the results
             */
            dataObject['Photo'] = '';
            dataObject['Signature'] = '';

            let chunk = 5000;
            app.getFaceImage(function (faceImageResult) {
                let faceImageResultArray = new Uint8Array(faceImageResult);
                let rawFaceImage = '';
                let faceImageResultSubArray, chunk = 5000;
                for (let i = 0, j = faceImageResultArray.length; i < j; i += chunk) {
                    faceImageResultSubArray = faceImageResultArray.subarray(i, i + chunk);
                    rawFaceImage += String.fromCharCode.apply(null, faceImageResultSubArray);
                }
                base64FaceReformattedImage = btoa(rawFaceImage);
                dataObject['Photo'] = `data:image/jpeg;base64,${base64FaceReformattedImage}`;

                finalData = dataObject;
            });
        } else {
            
        }
    },
    faceMatch: function (selfieImage) {
        var data = {
            'Data': {
                'ImageOne': finalData.Photo.split(',')[1],
                'ImageTwo': selfieImage.split(',')[1]
            },
            'Settings': {
                'SubscriptionId': APP_CONFIG.subscriptionId
            }
        };
        toggleLoader(true);
        $.ajax({
            url: APP_CONFIG.faceMatchURL + '/api/v1/facematch',
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(data),
            headers: {
                "Authorization": btoa(APP_CONFIG.username + ":" + APP_CONFIG.password),
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            success: function (result) {
                toggleLoader(false);
                console.log('result: ', result);
                Swal.fire({
                    title: 'Image uploaded!',
                    text: JSON.stringify(result),
                    icon: 'success'
                });
            },
            error: function (err) {
                toggleLoader(false);
                Swal.fire({
                    title: 'Error',
                    text: err.status + " - " + err.statusText,
                    icon: 'error'
                });
            }
        });
    }
}