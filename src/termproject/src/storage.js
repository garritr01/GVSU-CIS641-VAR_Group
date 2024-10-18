            
            // SCHEDULING CHOICE CODE
            
            /*
            <div style={{ display: 'flex' }}>
                <p>text:</p>
                <input 
                    value={newElementInput}
                    onChange={(e) => uponInputChange(e.target.value,setNewElementInput)}
                    />
                <button onClick={() => addButton(newElementInput)}>
                    Add Button
                </button>
                <button onClick={() => addEntry(newElementInput)}>
                    Add Entry
                </button>
                <button onClick={() => addTextBox(newElementInput)}>
                    Add Text Box
                </button>
                <button 
                    onClick={() => handleButton(includeStart,setIncludeStart)}
                    style={{ color: includeStart === 'enabled' ? 'black' : 'gray' }}
                    >
                    Add Start Time
                </button>
            </div>
            <div style={{ display: 'flex' }}>
                <p>Repeat type:</p>
                <button 
                    onClick={() => setRepeatType('specifiedDates')}
                    style={{ color: repeatType !== 'specifiedDates' ? 'black': 'grey' }}
                    >
                    Specified Dates
                </button>
                <button 
                    onClick={() => setRepeatType('specifiedSplit')}
                    style={{ color: repeatType !== 'specifiedSplit' ? 'black': 'grey' }}
                    >
                    Every x days
                </button>
                <button 
                    onClick={() => setRepeatType('weekly')}
                    style={{ color: repeatType !== 'weekly' ? 'black': 'grey' }}
                    >
                    Weekly
                </button>
                <button 
                    onClick={() => setRepeatType('monthly')}
                    style={{ color: repeatType !== 'monthly' ? 'black': 'grey' }}
                    >
                    Monthly
                </button>
                <button 
                    onClick={() => setRepeatType('yearly')}
                    style={{ color: repeatType !== 'yearly' ? 'black': 'grey' }}
                    >
                    Yearly
                </button>
            </div>
            {
                repeatType === 'specifiedDates' 
                ?   (
                        <div style = {{ display: 'flex' }}>
                            <p>Add Specific Dates</p>
                            <input
                                value={repeatInfoElement}
                                onChange={(e) => uponInputChange(e.target.value,setRepeatInfoElement)}
                                />
                            <button onClick={() => setRepeatInfo([...repeatInfo, repeatInfoElement])}>
                                Add
                            </button>
                            <p>On </p>
                            <ul style={{ 'listStyle': 'none', 'display': 'inline', paddingLeft: '2px', paddingRight: '2px' }}>
                                {repeatInfo.map((date, index) => (
                                    <li
                                        key={index}
                                        style={{ display: 'inline', cursor: 'pointer' }}
                                        onClick={() => setRepeatInfo(repeatInfo.
                                            filter((element) => (element !== date)))}
                                    >
                                        {date + ', '}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                : repeatType === 'specifiedSplit'
                ?   (
                        <div style = {{ display: 'flex' }}>
                            <p>Add Specific Dates</p>
                            <input
                                value={repeatInfoElement}
                                onChange={(e) => uponInputChange(e.target.value,setRepeatInfoElement)}
                                />
                            <button onClick={() => setRepeatInfo([...repeatInfo, repeatInfoElement])}>
                                Add
                            </button>
                            <p>Every </p>
                            <ul style={{ 'listStyle': 'none', 'display': 'inline', paddingLeft: '2px', paddingRight: '2px' }}>
                                {repeatInfo.map((split, index) => (
                                    <li
                                        key={index}
                                        style={{ display: 'inline', cursor: 'pointer' }}
                                        onClick={() => setRepeatInfo(repeatInfo.
                                            filter((element) => (element !== split)))}
                                    >
                                        {split + ', '}
                                    </li>
                                ))}
                            </ul>
                            <p> days</p>
                        </div>
                    )
                : repeatType === 'weekly'
                ?   (
                        <div style = {{ display: 'flex' }}>
                            <p>Add Specific Dates</p>
                            <input
                                value={repeatInfoElement}
                                onChange={(e) => uponInputChange(e.target.value,setRepeatInfoElement)}
                                />
                            <button onClick={() => setRepeatInfo([...repeatInfo, repeatInfoElement])}>
                                Add
                            </button>
                            <p>Every </p>
                            <ul style={{ 'listStyle': 'none', 'display': 'inline', paddingLeft: '2px', paddingRight: '2px' }}>
                                {repeatInfo.map((day, index) => (
                                    <li
                                        key={index}
                                        style={{ display: 'inline', cursor: 'pointer' }}
                                        onClick={() => setRepeatInfo(repeatInfo.
                                            filter((element) => (element !== day)))}
                                    >
                                        {getWeekdayString(day) + ', '}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                : repeatType === 'monthly'
                ?   (
                        <div style = {{ display: 'flex' }}>
                            <p>Add Specific Dates</p>
                            <input
                                value={repeatInfoElement}
                                onChange={(e) => uponInputChange(e.target.value,setRepeatInfoElement)}
                                />
                            <button onClick={() => setRepeatInfo([...repeatInfo, repeatInfoElement])}>
                                Add
                            </button>
                            <p>On the </p>
                            <ul style={{ 'listStyle': 'none', 'display': 'inline', paddingLeft: '2px', paddingRight: '2px' }}>
                                {repeatInfo.map((day, index) => (
                                    <li
                                        key={index}
                                        style={{ display: 'inline', cursor: 'pointer' }}
                                        onClick={() => setRepeatInfo(repeatInfo.
                                            filter((element) => (element !== day)))}
                                    >
                                        {day + ', '}
                                    </li>
                                ))}
                            </ul>
                            <p> of the month</p>
                        </div>
                    )
                : repeatType === 'yearly'
                ?   (
                        <div style = {{ display: 'flex' }}>
                            <p>Add Specific Dates</p>
                            <input
                                value={repeatInfoElement}
                                onChange={(e) => uponInputChange(e.target.value,setRepeatInfoElement)}
                                />
                            <button onClick={() => setRepeatInfo([...repeatInfo, repeatInfoElement])}>
                                Add
                            </button>
                            <p>Every year on </p>
                            <ul style={{ 'listStyle': 'none', 'display': 'inline', paddingLeft: '2px', paddingRight: '2px' }}>
                                {repeatInfo.map((date, index) => (
                                    <li
                                        key={index}
                                        style={{ display: 'inline', cursor: 'pointer' }}
                                        onClick={() => setRepeatInfo(repeatInfo.
                                            filter((element) => (element !== date)))}
                                    >
                                        {date + ','}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                : null
            }
            <div>
            */