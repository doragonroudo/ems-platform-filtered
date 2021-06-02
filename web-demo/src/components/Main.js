import React, { Component } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import db from './Database'
import { Card, Button, Badge, Carousel, ListGroup, ListGroupItem, Container, Row, Col, Accordion, Nav, Navbar, Form, FormControl } from 'react-bootstrap'

export class Main extends Component {

    constructor(props) {
        super(props)
        this.state = {

        }
    }

    render() {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#222222"}}>
                <NavigationBar />
                <Router>
                    <Switch>
                        <Route exact path="/">
                            <PatienceDashboard />
                        </Route>
                        <Route path="/services">
                            <ServiceDashboard />
                        </Route>
                    </Switch>
                </Router>
            </div>
        )
    }
}

class NavigationBar extends Component {
    render() {
        return (
            <Navbar bg="dark" variant="dark">
                <Navbar.Brand href="/">EMS Platform</Navbar.Brand>
                <Navbar.Collapse className="justify-content-end">
                    <Nav className="justify-content-end">
                        <Nav.Link href="/">Patiences Dashboard</Nav.Link>
                    </Nav>
                    <Nav className="justify-content-end">
                        <Nav.Link href="/services">Services Status</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
               
            </Navbar>
        )
    }
}

class ServiceDashboard extends Component {
    constructor(props) {
        super(props)
        this.state = {
            services: []
        }
    }

    componentDidMount() {
        db.collection("services_status").onSnapshot(snapshot => {

            let services = []

            snapshot.forEach(doc => {
                services.push(doc.data())
            })

            this.setState({
                services: services
            }, () => console.log(this.state))

        })
    }

    render() {
        return (
            <div className="pb-3 d-flex flex-rows justify-content-center flex-wrap">
                {
                    this.state.services.map((service, index) => {
                        return (
                            <ServiceCard service={service} />
                        )
                    })
                }
            </div>
        )
    }
}

class ServiceCard extends Component {
    constructor(props) {
        super(props)
        this.state = {
            services: []
        }
    }

    render() {
        return (
            <Card
                bg="dark"
                text="white"
                className="mt-3 mx-2"
            >
                <Card.Header>{this.props.service.name} <Badge className="float-right" variant="success">ONLINE</Badge></Card.Header>
                <Card.Body>
                    <ListGroup className="list-group-flush">
                        <ListGroupItem style={{ backgroundColor: "#343a40"}}>Version: <Badge variant="light">{this.props.service.version}</Badge></ListGroupItem>
                        <ListGroupItem style={{ backgroundColor: "#343a40"}}>IP: <Badge variant="light">{this.props.service.ip}</Badge></ListGroupItem>
                        <ListGroupItem style={{ backgroundColor: "#343a40"}}>PORT: <Badge variant="light">{this.props.service.port}</Badge></ListGroupItem>
                        <ListGroupItem style={{ backgroundColor: "#343a40"}}>Last Updated: <Badge variant="light">{this.props.service.timestamp.toDate().toDateString()} {this.props.service.timestamp.toDate().toLocaleTimeString('en-US')}</Badge></ListGroupItem>
                    </ListGroup>
                </Card.Body>
            </Card>
        )
    }
}


class PatienceDashboard extends Component {
    constructor(props) {
        super(props)
        this.state = {
            patiences: []
        }
    }

    componentDidMount() {
        db.collection("patiences_info").onSnapshot(snapshot => {

            let promises = []
            let patiences = []
            snapshot.forEach(doc => {
                promises.push(this.getVital(doc.id, doc.data()))
            })

            Promise.all(promises).then( (patience_ret) => {
                console.log(patience_ret)
                patiences = patience_ret
                
                this.setState({
                    patiences: patiences
                }, () => console.log(this.state))
            })

        })
    }

    getVital = (id, info) => {
        return db.collection("patiences_info").doc(id).collection('vitalsigns').orderBy("timestamp", "desc").get().then( snapshot => {

            let vital_signs = []

            snapshot.forEach(doc => {
                vital_signs.push(doc.data())
            })

            return { info, vital_signs}
        })
    }

    render() {
        return (
            <div className="pb-3 d-flex flex-column">
                {
                    this.state.patiences.map((patience, index) => {
                        return (<PatienceCard patience={patience} />)
                    })
                }
            </div>
        )
    }
}

class PatienceCard extends Component {
  render() {
    return (
        <Accordion defaultActiveKey="0">
            
      <Card bg="dark" text="white" className="mt-3 mx-3" key={this.props.patience.info.id}>
        <Card.Header>
            {this.props.patience.info.name}
            <Accordion.Toggle className="float-right text-white" as={Button} variant="link" eventKey={this.props.patience.info.id}>
                Toggle Detail
            </Accordion.Toggle>
        </Card.Header>

        <Accordion.Collapse eventKey={this.props.patience.info.id}>
        <Card.Body>
            <Card bg="dark" text="white" className="mt-3 mx-3" border="secondary">
                <Card.Header>Information</Card.Header>
                <Card.Body>
                    <ListGroup className="list-group-flush">
                        <ListGroupItem style={{ backgroundColor: "#343a40"}}>ID: <Badge variant="light">{this.props.patience.info.id}</Badge></ListGroupItem>
                        <ListGroupItem style={{ backgroundColor: "#343a40"}}>Age: <Badge variant="light">{this.props.patience.info.age}</Badge></ListGroupItem>
                        <ListGroupItem style={{ backgroundColor: "#343a40"}}>Medical Treatment Rights: <Badge variant="light">{this.props.patience.info.medical_treatment_right}</Badge></ListGroupItem>
                        <ListGroupItem style={{ backgroundColor: "#343a40"}}>Diagnosis: <Badge variant="light">{this.props.patience.info.diagnosis}</Badge></ListGroupItem>
                        <ListGroupItem style={{ backgroundColor: "#343a40"}}>Congenital Disease: <Badge variant="light">{this.props.patience.info.congenital_disease}</Badge></ListGroupItem>
                        <ListGroupItem style={{ backgroundColor: "#343a40"}}>Sympthom Description: <Badge variant="light">{this.props.patience.info.sympthom_description}</Badge></ListGroupItem>
                        <ListGroupItem style={{ backgroundColor: "#343a40"}}>Last Seen Normal: <Badge variant="light">{this.props.patience.info.last_seen_normal.toDate().toDateString()} {this.props.patience.info.last_seen_normal.toDate().toLocaleTimeString('en-US')}</Badge></ListGroupItem>
                        <ListGroupItem style={{ backgroundColor: "#343a40"}}>On Set: <Badge variant="light">{this.props.patience.info.onset.toDate().toDateString()}  {this.props.patience.info.onset.toDate().toLocaleTimeString('en-US')}</Badge></ListGroupItem>
                    </ListGroup>
                </Card.Body>
            </Card>

            <Card bg="dark" text="white" className="mt-3 mx-3" border="secondary">
                <Card.Header>Vital Signs</Card.Header>
                <Card.Body>
                    
                        {
                            this.props.patience.vital_signs.length === 0 ?
                            (
                                <ListGroup className="list-group-flush">
                                    <ListGroupItem style={{ backgroundColor: "#343a40"}}>No Vital Signs Data</ListGroupItem> 
                                </ListGroup>
                            ):
                            this.props.patience.vital_signs.map((vt, index) => {
                                return (
                                    <Card bg="dark" text="white" className="mb-3" border="secondary">
                                        <Card.Body>
                                            <ListGroup className="list-group-flush">
                                                <ListGroupItem style={{ backgroundColor: "#343a40"}}>Blood Pressure: <Badge variant="light">{vt.blood_pressure}</Badge></ListGroupItem>
                                                <ListGroupItem style={{ backgroundColor: "#343a40"}}>Oxygen Saturation: <Badge variant="light">{vt.oxygen_saturation}</Badge></ListGroupItem>
                                                <ListGroupItem style={{ backgroundColor: "#343a40"}}>Pulse Rate: <Badge variant="light">{vt.pulse_rate}</Badge></ListGroupItem>
                                                <ListGroupItem style={{ backgroundColor: "#343a40"}}>ECG Leads: <Badge variant="light">{vt.ecg_leads}</Badge></ListGroupItem>
                                                <ListGroupItem style={{ backgroundColor: "#343a40"}}>Timestamp: <Badge variant="light">{vt.timestamp.toDate().toDateString()} {vt.timestamp.toDate().toLocaleTimeString('en-US')}</Badge></ListGroupItem>
                                            </ListGroup>
                                        </Card.Body>
                                    </Card>
                                    
                                )
                            })
                        }
                </Card.Body>
            </Card>
            
            <Card bg="dark" text="white" className="mt-3 mx-3" border="secondary">
                <Card.Header>Images</Card.Header>
                <Card.Body>
                    <Container>
                        <Row>
                            <Col>
                            <Carousel>
                                {
                                    ["/img/EMS_Image.jpg"].map((item, index) => {
                                        return (
                                            <Carousel.Item className="text-center">
                                                <img
                                                    src={item}
                                                    style={{height: "350px", width: "350px", objectFit: "scale-down"}}
                                                />
                                                <Carousel.Caption>
                                                <h3>Image {index+1}</h3>
                                                </Carousel.Caption>
                                            </Carousel.Item>
                                        )
                                    })
                                }
                            </Carousel>
                            </Col>
                        
                        <Col>
                            <Carousel>
                                {
                                    ["/img/CTscan_A.jpg","/img/CTscan_B.jpg","/img/CTscan_C.jpg"].map((item, index) => {
                                        return (
                                            <Carousel.Item className="text-center">
                                                <img
                                                src={item}
                                                style={{height: "350px", width: "350px", objectFit: "scale-down"}}
                                                />
                                                <Carousel.Caption>
                                                <h3>CT Image {index+1}</h3>
                                                </Carousel.Caption>
                                            </Carousel.Item>
                                        )
                                    })
                                }
                            </Carousel>
                            </Col>
                        </Row>
                    </Container>
                </Card.Body>
            </Card>
        </Card.Body>
        </Accordion.Collapse>
      </Card>
        </Accordion>
    );
  }
}

export default Main;
