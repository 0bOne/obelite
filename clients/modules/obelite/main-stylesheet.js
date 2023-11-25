const noPaddingMarginBorder = {
    border: 0,
    padding: 0,
    margin: 0
};

const MainStyleSheet = {
    variables: {
        backgroundColor: 'black',
        titleColor: 'red',
        underlineColor: 'gray',
        mutedTextColor: 'gray',
        infoTextColor:  'white',
        firstTextColor: 'yellow',
        secondTextColor: 'green',
        headcellTextColor: 'green',
        helpTextColor: 'white',
        info2TextColor: 'green',
        buttonFocusColor: 'red',
    },
    //TODO: media queries
    fonts: {
        AlmaraiLight: './fonts/Almarai/Almarai-Light.woff2',
        AlmaraiRegular: './fonts/Almarai/Almarai-Regular.woff2',
        AlmaraiBold: './fonts/Almarai/Almarai-Bold.woff2',
        AlmaraiExtra: './fonts/Almarai/Almarai-ExtraBold.woff2'
    },
    styles: {
        _fontLight: {
            fontFamily: 'AlmaraiLight',
        },
        _fontNormal: {
            fontFamily: 'AlmaraiRegular',
        },
        _fontBold: {
            fontFamily: 'AlmaraiBold'
        },
        HTML: {
            extends: noPaddingMarginBorder,
            height: "100%"
        },
        BODY: {
            extends: noPaddingMarginBorder,
            fontFamily: 'AlmaraiRegular',
            backgroundColor: '-backgroundColor',
            display: 'flex',
            flexFlow: 'row',
            justifyContent: 'center',
            alignItems: 'stretch',
            width: '100%',
            height: '100%',
            fontSize: '1rem'
        },
        H1: {
            extends: noPaddingMarginBorder,
            fontFamily: 'AlmaraiBold',
            fontSize: "1rem",
            color: "-titleColor"
        },
        P: noPaddingMarginBorder,
        _MenuButton: {
            fontFamily: 'AlmaraiBold',
            color: '-firstTextColor',
            border: 'none',
            padding: '0px',
            margin: '0px',
            width: "100%",
            fontSize: 'inherit',
            backgroundColor: 'transparent'
        },
        "_MenuButton:focus": {
            color: 'black',
            backgroundColor: 'var(--buttonFocusColor)',
            border: 'none',
            textDecoration: 'none',
            outline: 'none'
        }
    }
};

export default MainStyleSheet;