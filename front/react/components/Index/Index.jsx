import React from 'react';


export default class Index extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            counter: 0
        };

        this.changeCounter = this.changeCounter.bind(this);
    }

    componentWillMount() {
        const {savedOut} = this.props;

        if (savedOut) {
            this.setState({
                counter: savedOut,
            });
        }
    }

    changeCounter(e) {
        this.setState({counter: +e.target.value});
    }

    render() {
        const {counter} = this.state;

        return(
            <div style={{
                fontSize: 40 + 'px',
                textAlign: 'center',
                lineHeight: 100 + 'vh',
            }}>
                Index! Next value is:
                <input type="number" style={{fontSize: 40 + 'px'}} value={counter} onChange={this.changeCounter}/>
            </div>
        )
    }

    componentWillUnmount() {
        const {setOut} = this.props;
        const {counter} = this.state;
        setOut(counter);
    }
}