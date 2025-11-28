// Inicializácia Stripe s vaším publisheable key
const stripe = Stripe('pk_test_51SYCj5Q8CEMJRvhs60ckzQOTUEKytiRaqvnvrblQgH5q4vhn6gcJGom2WGAixhaZDoLPCGAJ5ZYTdwIvpINy80Qm00PYeyZZdT'); // Nahraďte reálnym kľúčom
let elements;
let paymentRequest;

// Konfigurácia pre Payment Request API (Apple Pay/Google Pay)
paymentRequest = stripe.paymentRequest({
    country: 'SK',
    currency: 'eur',
    total: {
        label: 'MatustCT.sk',
        amount: 1999, // Suma v centoch (19.99€)
    },
    requestPayerName: true,
    requestPayerEmail: true,
});

// Vytvorenie Payment Request Button
const paymentRequestElement = elements.create('paymentRequestButton', {
    paymentRequest: paymentRequest,
});

// Skontrolujte dostupnosť Apple Pay/Google Pay
paymentRequest.canMakePayment().then(result => {
    if (result) {
        // Zobraz tlačidlo ak je dostupné
        paymentRequestElement.mount('#payment-request-button');
    } else {
        // Skry tlačidlo ak nie je dostupné
        document.getElementById('payment-request-button').style.display = 'none';
    }
});

// Spracovanie úspešnej platby cez Payment Request
paymentRequest.on('paymentmethod', async (ev) => {
    // Tu zavoláte na váš server pre vytvorenie PaymentIntent
    const {clientSecret} = await fetch('/create-payment-intent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            paymentMethodType: 'card',
            currency: 'eur',
            amount: 1999,
        }),
    }).then(r => r.json());

    // Potvrdenie platby so Stripe
    const {error: confirmError} = await stripe.confirmCardPayment(
        clientSecret,
        {
            payment_method: ev.paymentMethod.id,
        },
        {handleActions: false}
    );

    if (confirmError) {
        ev.complete('fail');
        showMessage('Platba zlyhala: ' + confirmError.message);
    } else {
        ev.complete('success');
        
        // Skúste potvrdiť platbu znova
        const {error} = await stripe.confirmCardPayment(clientSecret);
        if (error) {
            showMessage('Platba zlyhala: ' + error.message);
        } else {
            showMessage('Platba prebehla úspešne!');
        }
    }
});

// Inicializácia Stripe Elements pre klasickú kartovú platbu
function initializeCardPayment() {
    elements = stripe.elements();
    
    const cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
        },
    });
    
    cardElement.mount('#card-element');
    
    // Spracovanie formulára
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const submitButton = document.getElementById('submit-button');
        submitButton.disabled = true;
        
        // Vytvorenie PaymentMethod
        const {error, paymentMethod} = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        });
        
        if (error) {
            showMessage('Chyba: ' + error.message);
            submitButton.disabled = false;
        } else {
            // Zavolajte na váš server pre dokončenie platby
            const {clientSecret} = await fetch('/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    paymentMethodId: paymentMethod.id,
                    amount: 1999,
                    currency: 'eur',
                }),
            }).then(r => r.json());
            
            // Potvrdenie platby
            const {error: confirmError} = await stripe.confirmCardPayment(clientSecret);
            
            if (confirmError) {
                showMessage('Platba zlyhala: ' + confirmError.message);
                submitButton.disabled = false;
            } else {
                showMessage('Platba prebehla úspešne!');
            }
        }
    });
}

// Pomocná funkcia pre zobrazenie správ
function showMessage(messageText) {
    const messageContainer = document.getElementById('payment-status');
    messageContainer.innerHTML = messageText;
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 5000);
}

// Inicializácia po načítaní stránky
document.addEventListener('DOMContentLoaded', initializeCardPayment);