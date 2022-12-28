class Kernels extends Utils{
    constructor(params, X, Y) {
        super();
        this.EQ_params = params.EQ_params;
        this.RQ_params = params.RQ_params;
        this.LP_params = params.LP_params;
        this.ESS1_params = params.ESS1_params;
        this.ESS2_params = params.ESS2_params;
        this.KL2 = this.L2_Squared(X, Y);
        this.KD = this.Difference(X, Y);
    }

    Matrix()
    {
        return tf.tidy(() => {
            let K = this.ExponentiatedQuadratic(this.EQ_params)
                        .add(this.RationalQuadratic(this.RQ_params))
                        .add(this.LocalPeriodic(this.LP_params))
                        .add(this.ExpSinSquared(this.ESS1_params))
                        .add(this.ExpSinSquared(this.ESS2_params))
            return K;
        });
    }

    ExponentiatedQuadratic(params)
    {
        return tf.tidy(() => {
            let K = this.KL2;
            return tf.exp(tf.mul(K, -1).div(tf.mul(2, tf.pow(params['length_scale'], 2)))).mul(tf.pow(params['amplitude'], 2));
        });
    }

    RationalQuadratic(params)
    {
        return tf.tidy(() => {
            let K = this.KL2;
            return tf.mul(tf.pow(params['amplitude'], 2), tf.pow(tf.add(1.0, tf.div(K, tf.mul(2*params['scale_mixture_rate'], tf.pow(params['length_scale'], 2)))), -params['scale_mixture_rate']));
        });
    }

    ExpSinSquared(params)
    {
        return tf.tidy(() => { 
            let K = this.KD;
            K = tf.mul(tf.pow(tf.sin(tf.div(tf.mul(Math.PI, K), params['period'])), 2.0), -2);
            K = tf.sum(K, [-1, -2]);
            tf.mul(tf.pow(params['amplitude'], 2), tf.exp(tf.div(K, tf.pow(params['length_scale'], 2.0))));
            return tf.mul(tf.pow(params['amplitude'], 2), tf.exp(tf.div(K, tf.pow(params['length_scale'], 2.0))));
        });
    }

    LocalPeriodic(params)
    {
        return tf.tidy(() => { 
            return tf.mul(this.ExponentiatedQuadratic(params.EQ), this.ExpSinSquared(params.ESS));
        });
    }

    Linear(X, Y, params)
    {
        return tf.tidy(() => { 
            let K = tf.matMul(X.sub(params['shift']), tf.transpose(Y.sub(params['shift'])));
            return K.mul(tf.pow(params['slope_variance'], 2)).add(tf.pow(params['bias_variance'] , 2)).mul(params['amplitude']);
        });
    }
}

