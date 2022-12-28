if ( 'function' === typeof importScripts) {
    importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.1.0/dist/tf.min.js");
    importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgpu/dist/tf-backend-webgpu.js");
    importScripts("https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.5.0/math.js");
    importScripts("https://d3js.org/d3.v7.min.js");

    importScripts("model/params.js")
    importScripts("model/Utils.js");
    importScripts("model/Kernels.js");
    importScripts("model/model.js");
    importScripts("model/Gaussian_Process.js");
};

this.onmessage = function(e) {
    (async() => {
        await tf.ready 
        tf.setBackend('webgl');
        forecast(e.data[1], e.data[0]);
        //let LINK = "https://raw.githubusercontent.com/calso-christian/Sensor-Project-Website/main/EMB/Sensor%20Readings.csv";
        //await SampleForecast(LINK, e.data[0]);
      })();
};


async function forecast(data, sensor){
    let forward = 600;
    let start = data.X.feature[data.X.feature.length - 1] + 1;
    let X = await tf.tensor(data.X.feature).reshape([-1,1]);
    let y = await tf.tensor(data.y).reshape([-1,1])
    let X_predict = await tf.range(start, start + forward, 1).reshape([-1,1]);
    obj = new GaussianProcessRegression(params[sensor]);
    [y_mean, y_cov] = await obj.Condition(X_predict, X, y);
    y_cov = await y_cov.array();
    y_cov = y_cov.map(x => x.map( x => x || 0));
    y_cov = tf.tensor(y_cov);
    y_std = tf.sqrt(obj.getDiag(y_cov, y_cov.shape[0]));
    self.postMessage( {
        X_predict: await X_predict.squeeze().array(),
        X: await X.squeeze().array(),
        y: await y.squeeze().array(),
        y_UpperCI: await tf.squeeze(y_mean.add(tf.mul(y_std, 2))).array(),
        y_LowerCI: await  tf.squeeze(y_mean.sub(tf.mul(y_std, 2))).array(),
        y_mean: await y_mean.squeeze().array(),
        y_cov: await y_cov.squeeze().array(),
        sensor: sensor,
    });
}

async function SampleForecast(LINK, sensor){
    let X = [], y = [], obj, X_predict, y_mean, y_cov, y_std;
    await d3.csv(LINK).then(async function(data) {
        for (let val of Object.values(data)) {
            X.push([Number(val.Min)]);
            y.push(parseFloat(val[sensor]));
        }
        let i = X.length - 2;
        let start = X[i][0];
        let forward = 12600;
        X = await tf.slice(X, 0, i).reshape([-1,1]);
        y = await tf.slice(y, 0, i).reshape([-1,1]);
        X_predict = tf.range(start, start + forward, 1).reshape([-1,1]);
        obj = new GaussianProcessRegression(params[sensor]);
        [y_mean, y_cov] = await obj.Condition(X_predict, X, y);
        y_cov = await y_cov.array();
        y_cov = y_cov.map(x => x.map( x => x || 0));
        y_cov = tf.tensor(y_cov);
        y_std = tf.sqrt(obj.getDiag(y_cov, y_cov.shape[0]));
    });

    
    self.postMessage( {
        X_predict: await X_predict.squeeze().array(),
        X: await X.squeeze().array(),
        y: await y.squeeze().array(),
        y_UpperCI: await tf.squeeze(y_mean.add(tf.mul(y_std, 2))).array(),
        y_LowerCI: await  tf.squeeze(y_mean.sub(tf.mul(y_std, 2))).array(),
        y_mean: await y_mean.squeeze().array(),
        y_cov: await y_cov.squeeze().array(),
        sensor: sensor
    });
};


