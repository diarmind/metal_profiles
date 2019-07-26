import React from 'react';
import Vue from 'vue';
import App from './vue/App.vue';


export default class ProfileCreation extends React.Component {

    constructor(props) {
        super(props);
        this.vueAppEl = React.createRef();
    }
    componentWillUnmount() {
        delete window.vueSetOut;
    }

    componentDidMount() {
        const {setOut} = this.props;
        window.vueSetOut = setOut;
        new Vue({
            render: h => h(App),
          }).$mount(this.vueAppEl.current);
    }

    render() {
        const {dataIn} = this.props;

        return(
            <div style={{ position: 'relative' }}>
                <div
                    ref={this.vueAppEl}
                ></div>
            </div>
        )
    }

    
}