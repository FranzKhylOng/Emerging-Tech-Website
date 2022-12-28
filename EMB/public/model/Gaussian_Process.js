class GaussianProcessRegression extends Utils{
    constructor(params){
        super();
        this.params = params;
        this.noise = params.noise;
    }

    async Condition(N, X, y)
    {
        let K_XX = new Kernels(this.params, X, X).Matrix();
        let K_XN = new Kernels(this.params, X, N).Matrix();
        let K_NN = new Kernels(this.params, N, N).Matrix();
        let I = await this.Inverse(tf.add(K_XX, tf.eye(K_XX.shape[1], K_XX.shape[0]).mul(this.noise)));
        let K = tf.transpose(K_XN).matMul(I);
        I.dispose(); K_XX.dispose();
        return [K.matMul(y), K_NN.sub(K.matMul(K_XN))];
    }
}

