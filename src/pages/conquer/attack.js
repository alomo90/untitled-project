import React, { useEffect, useState } from "react";
import {login, authFetch, useAuth, logout, getSession, getSessionState} from "../../auth";
import 'bootstrap/dist/css/bootstrap.css';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import InputGroup from 'react-bootstrap/InputGroup';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer'
import "./attack.css";
import Select from 'react-select';


const initialDefenderValues = {
    "recruits": "",
    "defense": "",
    "flex": "",
    "big_flex": "",
    "military_bonus": "",
    "shields": "",
}
const initialAttackerValues = {
    "recruits": "",
    "attack": "",
    "flex": "",
    "big_flex": "",
    "military_bonus": "",
    "generals": "",
}


function Attack(props) {
    const [defenderValues, setDefenderValues] = useState(initialDefenderValues);
    const [attackerValues, setAttackerValues] = useState(initialAttackerValues);
    const [selected, setSelected] = useState(props.initialKd || undefined);
    const [calcMessage, setCalcMessage] = useState({"message": "Press calculate to project results"})
    const [loadingCalc, setLoadingCalc] = useState(false);
    const [targetKdInfo, setTargetKdInfo] = useState({});
    const [attackResults, setAttackResults] = useState([]);
  
    const handleChange = (selectedOption) => {
        setSelected(selectedOption.value);
        const fetchData = async () => {
            await authFetch("api/kingdom/" + selectedOption.value).then(r => r.json()).then(r => setTargetKdInfo(r));
        };
        fetchData();
    };
    const handleDefenderChange = (e) => {
        const { name, value } = e.target;
        setDefenderValues({
          ...defenderValues,
          [name]: value,
        });
    };
    const handleAttackerChange = (e) => {
        const { name, value } = e.target;
        setAttackerValues({
          ...attackerValues,
          [name]: value,
        });
    };
    const onClickAttack = () => {
        if (selected != undefined) {
            const opts = {
                "attackerValues": attackerValues,
            };
            const updateFunc = async () => authFetch('api/attack/' + selected, {
                method: 'POST',
                body: JSON.stringify(opts)
            }).then(r => r.json()).then(r => {setAttackResults(attackResults.concat(r)); setCalcMessage("")})
            props.updateData(['kingdom', 'projects', 'attackhistory'], [updateFunc]);
        } else {
            setCalcMessage({"message": "Please select a target in order to attack"})
        }
    };
    const onClickCalculate = async (e) => {
        if (selected != undefined) {
            const opts = {
                "attackerValues": attackerValues,
                "defenderValues": defenderValues,
            };
            const updateFunc = async () => authFetch('api/calculate/' + selected, {
                method: 'POST',
                body: JSON.stringify(opts)
            }).then(r => r.json()).then(r => setCalcMessage(r))
            setLoadingCalc(true);
            await updateFunc();
            setLoadingCalc(false);
        } else {
            setCalcMessage({"message": "Please select a target in order to calculate"})
        }
    };
    const kdFullLabel = (kdId) => {
        if (kdId != undefined) {
            return props.data.kingdoms[parseInt(kdId)] + " (" + props.data.galaxies_inverted[kdId] + ")"
        } else {
            return "Defender"
        }
        
    }

    const kingdomOptions = Object.keys(props.data.kingdoms).map((kdId) => {
        return {"value": kdId, "label": kdFullLabel(kdId)}
    })
    const displayPercent = (percent) => `${(percent * 100).toFixed(1)}%`;
    if (props.data.projects.current_bonuses?.military_bonus && attackerValues.military_bonus === "") {
        setAttackerValues({
            ...attackerValues,
            ["military_bonus"]: props.data.projects.current_bonuses.military_bonus,
        });
    }

    const toasts = attackResults.map((results, index) =>
        <Toast
            key={index}
            onClose={(e) => setAttackResults(attackResults.slice(0, index).concat(attackResults.slice(index + 1, 999)))}
            show={true}
            bg={results.status === "success" ? "success" : "warning"}
        >
            <Toast.Header>
                <strong className="me-auto">Attack Results</strong>
            </Toast.Header>
            <Toast.Body>{results.message}</Toast.Body>
        </Toast>
    )
    return (
        <div className="attack">
            <ToastContainer position="bottom-end">
                {toasts}
            </ToastContainer>
            <h2>Attack</h2>
            <form className="attack-kingdom-form">
                <label id="aria-label" htmlFor="aria-example-input">
                    Select a target (type to filter)
                </label>
                <Select className="attack-kingdom-select" options={kingdomOptions} onChange={handleChange} autoFocus={true} />
            </form>
            <div className="battle-stats">
                <div className="defender-stats">
                    <h3>{kdFullLabel(selected)}</h3>
                    <div className="defender-detail">
                        <Table className="defender-table" striped bordered hover size="sm">
                            <thead>
                                <tr>
                                    <th>Input</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Recruits</td>
                                    <td>
                                        {   targetKdInfo.hasOwnProperty("units")
                                            ? <Form.Control 
                                                className="unit-form"
                                                id="recruits-input"
                                                name="recruits"
                                                value={targetKdInfo.units.recruits || "0"} 
                                                placeholder="0"
                                                disabled
                                            />
                                            : <Form.Control 
                                                className="unit-form"
                                                id="recruits-input"
                                                name="recruits"
                                                onChange={handleDefenderChange}
                                                value={defenderValues.recruits || ""} 
                                                placeholder="0"
                                            />
                                        }
                                    </td>
                                </tr>
                                <tr>
                                    <td>Defenders</td>
                                    <td>
                                        {   targetKdInfo.hasOwnProperty("units")
                                            ? <Form.Control 
                                                className="unit-form"
                                                id="defenders-input"
                                                name="defense"
                                                onChange={handleDefenderChange}
                                                value={targetKdInfo.units.defense || "0"} 
                                                placeholder="0"
                                                disabled
                                            />
                                            : <Form.Control 
                                                className="unit-form"
                                                id="defenders-input"
                                                name="defense"
                                                onChange={handleDefenderChange}
                                                value={defenderValues.defense || ""} 
                                                placeholder="0"
                                            />
                                        }
                                    </td>
                                </tr>
                                <tr>
                                    <td>Flexers</td>
                                    <td>
                                        {   targetKdInfo.hasOwnProperty("units")
                                            ? <Form.Control 
                                                className="unit-form"
                                                id="flexers-input"
                                                name="flex"
                                                value={targetKdInfo.units.flex || "0"} 
                                                placeholder="0"
                                                disabled
                                            />
                                            : <Form.Control 
                                                className="unit-form"
                                                id="flexers-input"
                                                name="flex"
                                                onChange={handleDefenderChange}
                                                value={defenderValues.flex || ""} 
                                                placeholder="0"
                                            />
                                        }
                                    </td>
                                </tr>
                                <tr>
                                    <td>Big Flexers</td>
                                    <td>
                                        {   targetKdInfo.hasOwnProperty("units")
                                            ? <Form.Control 
                                                className="unit-form"
                                                id="big-flexers-input"
                                                name="big_flex"
                                                value={targetKdInfo.units.big_flex || "0"} 
                                                placeholder="0"
                                                disabled
                                            />
                                            : <Form.Control 
                                                className="unit-form"
                                                id="big-flexers-input"
                                                name="big_flex"
                                                onChange={handleDefenderChange}
                                                value={defenderValues.big_flex || ""} 
                                                placeholder="0"
                                            />
                                        }
                                    </td>
                                </tr>
                                <tr>
                                    <td>Military Efficiency</td>
                                    <td>
                                        {   targetKdInfo.hasOwnProperty("current_bonuses")
                                            ? <InputGroup className="mb-3">
                                                <Form.Control
                                                    className="unit-form"
                                                    id="military-efficiency-input"
                                                    name="military_bonus"
                                                    value={targetKdInfo.current_bonuses.military_bonus * 100 || ""} 
                                                    placeholder="0"
                                                    disabled
                                                />
                                                <InputGroup.Text id="basic-addon2">%</InputGroup.Text>
                                            </InputGroup>
                                            : <InputGroup className="mb-3">
                                                <Form.Control
                                                    className="unit-form"
                                                    id="military-efficiency-input"
                                                    name="military_bonus"
                                                    onChange={handleDefenderChange}
                                                    value={defenderValues.military_bonus || ""} 
                                                    placeholder="0"
                                                />
                                                <InputGroup.Text id="basic-addon2">%</InputGroup.Text>
                                            </InputGroup>
                                        }
                                    </td>
                                </tr>
                                <tr>
                                    <td>Shields</td>
                                    <td>
                                        {   targetKdInfo.hasOwnProperty("shields")
                                            ? <InputGroup className="mb-3">
                                                <Form.Control
                                                    className="unit-form"
                                                    id="shields-input"
                                                    name="shields"
                                                    value={targetKdInfo.shields.military * 100 || ""} 
                                                    placeholder="0"
                                                    disabled
                                                />
                                                <InputGroup.Text id="basic-addon2">%</InputGroup.Text>
                                            </InputGroup>
                                            : <InputGroup className="mb-3">
                                                <Form.Control
                                                    className="unit-form"
                                                    id="shields-input"
                                                    name="shields"
                                                    onChange={handleDefenderChange}
                                                    value={defenderValues.shields || ""} 
                                                    placeholder="0"
                                                />
                                                <InputGroup.Text id="basic-addon2">%</InputGroup.Text>
                                            </InputGroup>
                                        }
                                    </td>
                                </tr>
                                <tr>
                                    <td>Other Bonuses</td>
                                    <td>
                                        <InputGroup className="mb-3">
                                            <Form.Control
                                            className="unit-form"
                                            id="other-bonuses-input"
                                            name="other_bonuses"
                                            value={defenderValues.other_bonuses * 100 || ""} 
                                            placeholder="0"
                                            disabled
                                            />
                                            <InputGroup.Text id="basic-addon2">%</InputGroup.Text>
                                        </InputGroup>
                                    </td>
                                </tr>
                            </tbody>
                        </Table>
                        <div className="defender-text-boxes">
                            <div className="text-box defender-losses-box">
                                <h4>Their Losses</h4> 
                                <div className="text-box-item">
                                    <span className="text-box-item-title">Recruits</span>
                                    <span className="text-box-item-value">{calcMessage.defender_losses?.recruits || "--"}</span>
                                </div>
                                <div className="text-box-item">
                                    <span className="text-box-item-title">Defenders</span>
                                    <span className="text-box-item-value">{calcMessage.defender_losses?.defense || "--"}</span>
                                </div>
                                <div className="text-box-item">
                                    <span className="text-box-item-title">Flexers</span>
                                    <span className="text-box-item-value">{calcMessage.defender_losses?.flex || "--"}</span>
                                </div>
                                <div className="text-box-item">
                                    <span className="text-box-item-title">Big Flexers</span>
                                    <span className="text-box-item-value">{calcMessage.defender_losses?.big_flex || "--"}</span>
                                </div>
                                <br />
                                <div className="text-box-item">
                                    <span className="text-box-item-title">Unit Loss Rate</span>
                                    <span className="text-box-item-value">{displayPercent(calcMessage.defender_unit_losses_rate) || "--"}</span>
                                </div>
                                <div className="text-box-item">
                                    <span className="text-box-item-title">Stars Loss Rate</span>
                                    <span className="text-box-item-value">{displayPercent(calcMessage.defender_stars_loss_rate) || "--"}</span>
                                </div>

                            </div>
                            <div className="text-box defender-defense-box">
                                <h4>Their Defense</h4> 
                                <div className="text-box-item">
                                    <span className="defender-defense">{calcMessage.defender_defense || "--"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="attacker-stats">
                    <h3>{kdFullLabel(props.data.kingdom.kdId)}</h3>
                    <div className="attacker-detail">
                        <div className="attacker-text-boxes">
                            <div className="text-box attacker-losses-box">
                                <h4>Your Losses</h4> 
                                <div className="text-box-item">
                                    <span className="text-box-item-title">Attackers</span>
                                    <span className="text-box-item-value">{calcMessage.attacker_losses?.attack || "--"}</span>
                                </div>
                                <div className="text-box-item">
                                    <span className="text-box-item-title">Flexers</span>
                                    <span className="text-box-item-value">{calcMessage.attacker_losses?.flex || "--"}</span>
                                </div>
                                <div className="text-box-item">
                                    <span className="text-box-item-title">Big Flexers</span>
                                    <span className="text-box-item-value">{calcMessage.attacker_losses?.big_flex || "--"}</span>
                                </div>
                                <br />
                                <br />
                                <br />
                                <div className="text-box-item">
                                    <span className="text-box-item-title">Unit Loss Rate</span>
                                    <span className="text-box-item-value">{displayPercent(calcMessage.attacker_unit_losses_rate) || "--"}</span>
                                </div>
                            </div>
                            <div className="text-box attacker-defense-box">
                                <h4>Your Offense</h4> 
                                <div className="text-box-item">
                                    <span className="attacker-offense">{calcMessage.attacker_offense || "--"}</span>
                                </div>
                            </div>
                        </div>
                        <Table className="attacker-table" striped bordered hover size="sm">
                            <thead>
                                <tr>
                                    <th>Value</th>
                                    <th>Available</th>
                                    <th>Input</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>
                                        <Form.Control 
                                            className="unit-form"
                                            id="attack-input"
                                            name="attack"
                                            onChange={handleAttackerChange}
                                            value={attackerValues.attack || ""} 
                                            placeholder="0"
                                        />
                                    </td>
                                    <td>{props.data.kingdom?.units?.attack}</td>
                                    <td>Attackers</td>
                                </tr>
                                <tr>
                                    <td>
                                        <Form.Control 
                                            className="unit-form"
                                            id="flexers-input"
                                            name="flex"
                                            onChange={handleAttackerChange}
                                            value={attackerValues.flex || ""} 
                                            placeholder="0"
                                        />
                                    </td>
                                    <td>{props.data.kingdom?.units?.flex}</td>
                                    <td>Flexers</td>
                                </tr>
                                <tr>
                                    <td>
                                        <Form.Control 
                                            className="unit-form"
                                            id="big-flexers-input"
                                            name="big_flex"
                                            onChange={handleAttackerChange}
                                            value={attackerValues.big_flex || ""} 
                                            placeholder="0"
                                        />
                                    </td>
                                    <td>{props.data.kingdom?.units?.big_flex || 0}</td>
                                    <td>Big Flexers</td>
                                </tr>
                                <tr>
                                    <td>
                                        <Form.Control 
                                            className="unit-form"
                                            id="military-efficiency-input"
                                            name="military_bonus"
                                            onChange={handleAttackerChange}
                                            value={displayPercent(props.data.projects.current_bonuses?.military_bonus)} 
                                            placeholder="0"
                                            disabled
                                        />
                                    </td>
                                    <td></td>
                                    <td>Military Efficiency</td>
                                </tr>
                                <tr>
                                    <td>
                                        <Form.Control 
                                            className="unit-form"
                                            id="other-bonuses-input"
                                            name="other_bonuses"
                                            value="0%" 
                                            placeholder="0%"
                                            disabled
                                        />
                                    </td>
                                    <td></td>
                                    <td>Other Bonuses</td>
                                </tr>
                                <tr>
                                    <td>
                                        <Form.Control 
                                            className="unit-form"
                                            id="generals-input"
                                            name="generals"
                                            onChange={handleAttackerChange}
                                            value={attackerValues.generals || ""} 
                                            placeholder="0"
                                        />
                                    </td>
                                    <td>{props.data.kingdom?.generals_available}</td>
                                    <td>Generals</td>
                                </tr>
                            </tbody>
                        </Table>
                    </div>
                </div>
            </div>
            {/* <div className="attack-results"> */}
                <div className="text-box attack-results-box">
                    <span class="box-span">{calcMessage.message}</span>
                </div>
            {/* </div> */}
            <div className="attack-buttons">
                {
                    loadingCalc
                    ? <Button className="calculate-button" variant="primary" type="submit" disabled>
                        Loading...
                    </Button>
                    : <Button className="calculate-button" variant="primary" type="submit" onClick={onClickCalculate}>
                        Calculate
                    </Button>
                }
                {
                    props.loading.kingdom
                    ? <Button className="attack-button" variant="primary" type="submit" disabled>
                        Loading...
                    </Button>
                    : <Button className="attack-button" variant="primary" type="submit" onClick={onClickAttack}>
                        Attack
                    </Button>
                }
            </div>
        </div>
    )
}

export default Attack;