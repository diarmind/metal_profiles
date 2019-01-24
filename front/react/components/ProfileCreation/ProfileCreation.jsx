import React from 'react';


export default class ProfileCreation extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            counter: 0
        };

        this.changeCounter = this.changeCounter.bind(this);
    }

    changeCounter(e) {
        this.setState({counter: +e.target.value});
    }

    render() {
        const {dataIn} = this.props;

        return(
            <div className="text">
                Profile creation! Incremented one is: {dataIn}!
            </div>
        )
    }

    componentWillUnmount() {
        const {setOut} = this.props;
        setOut(null);
    }
}